import { Request, Response } from "express";
import type { Medication, MedicationFulfillment } from "../../../src/types/prescription";
import MedicalRecord from "../models/medicalRecord.model";
import User from "../models/user.model";
import path from 'path';
import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

function fileFilter(req: any, file: any, cb: any) {
  // Accept only pdf and images
  if (/\.(pdf|jpg|jpeg|png)$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed!'), false);
  }
}

const upload = multer({ storage, fileFilter });

export const createMedicalRecord = async (req: Request, res: Response): Promise<void> => {
    const { 
        patientId, 
        title, 
        type, 
        date, 
        details, 
        fileUrl, 
        isPrivate, 
        privacyLevel,
        tags,
        prescriptionId
    } = req.body;
    // Log incoming request parameters
    console.log('[createMedicalRecord] Incoming params:', {
        patientId,
        providerId: req.body.providerId || (details && details.providerId),
        prescriptionId,
        type,
        details
    });
    try {
        // For pharmacy/lab/radiology, get providerId from request body (details.providerId or top-level)
        let providerId = req.body.providerId;
        if (!providerId && details && details.providerId) {
            providerId = details.providerId;
        }
        // For other types (e.g., consultation), default to logged-in user
        if (!providerId) {
            providerId = (req as any).user.id;
        }
        
        // Check if patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: "Patient not found" });
            return;
        }

        // Require prescriptionId for lab_result, imaging, or pharmacy records
        if (["lab_result", "imaging", "pharmacy"].includes(type) && !prescriptionId) {
            res.status(400).json({ message: "prescriptionId is required for lab, imaging, and pharmacy records" });
            return;
        }

        // Set default privacy level based on record type
        let finalPrivacyLevel = privacyLevel;
        if (!finalPrivacyLevel) {
            if (type === 'consultation') {
                finalPrivacyLevel = 'doctor_only'; // Consultation notes are private by default
            } else if (type === 'medication') {
                finalPrivacyLevel = 'patient_visible'; // Pharmacy requests are visible to patients
            } else {
                finalPrivacyLevel = 'shared'; // Other records are shared by default
            }
        }

        // Prevent patientId == providerId
        console.log('createMedicalRecord patientId:', patientId);
        console.log('createMedicalRecord providerId:', providerId);
        if (patientId.toString() === providerId.toString()) {
            res.status(400).json({ message: "patientId and providerId cannot be the same." });
            return;
        }

        // Prevent duplicate pharmacy requests for the same prescription and patient
        if (type === 'medication' && prescriptionId) {
            const existing = await MedicalRecord.findOne({
                type: 'medication',
                patientId,
                prescriptionId,
                status: { $ne: 'cancelled' }
            });
            if (existing) {
                res.status(400).json({ message: 'A pharmacy request for this prescription already exists.' });
                return;
            }
        }

        // Set initial status for lab_result and its labTests
        if (type === 'lab_result') {
            if (details && Array.isArray(details.labTests)) {
                details.labTests = details.labTests.map((test: any) => ({
                    ...test,
                    status: 'pending'
                }));
            }
        }
        // Set initial status for imaging and its radiology items
        if (type === 'imaging') {
            if (details && Array.isArray(details.radiology)) {
                details.radiology = details.radiology.map((exam: any) => ({
                    ...exam,
                    status: 'pending'
                }));
            }
        }
        // Set initial status for medication items and ensure all details are preserved
        if (type === 'medication') {
            if (details && Array.isArray(details.medications)) {
                details.medications = details.medications.map((med: any) => {
                    // Make sure all fields are preserved and a status is added
                    return {
                        ...med, // Keep all existing fields (name, dosage, frequency, duration, instructions, etc.)
                        status: med.status || 'pending',
                        available: med.available !== undefined ? med.available : true
                    };
                });
            }
        }
        const medicalRecord = new MedicalRecord({
            patientId,
            providerId,
            title,
            type,
            date,
            details,
            fileUrl,
            isPrivate: isPrivate || false,
            privacyLevel: finalPrivacyLevel,
            tags: tags || [],
            prescriptionId: prescriptionId || undefined,
            status: (type === 'lab_result' || type === 'imaging' || type === 'medication') ? 'pending' : undefined
        });

        // Ensure assigned provider fields are set for new records
        if (type === 'medication' && providerId) {
            if (!details.assignedPharmacyId) details.assignedPharmacyId = providerId;
        }
        if (type === 'lab_result' && providerId) {
            if (!details.assignedLabId) details.assignedLabId = providerId;
        }
        if (type === 'imaging' && providerId) {
            if (!details.assignedRadiologistId) details.assignedRadiologistId = providerId;
        }

        await medicalRecord.save();

        // Update prescription medication statuses when a pharmacy request is created
        if (type === 'medication' && prescriptionId) {
            try {
                const Prescription = require('../models/prescription.model').default;
                const prescription = await Prescription.findById(prescriptionId);
                
                if (prescription && prescription.medications) {
                    // Update all medication statuses to 'pending' when pharmacy request is created
                    prescription.medications.forEach((medication: any) => {
                        if (!medication.status || medication.status === 'not_requested') {
                            medication.status = 'pending';
                        }
                    });
                    await prescription.save();
                    console.log('Updated prescription medication statuses to pending');
                }
            } catch (prescriptionError) {
                console.error('Error updating prescription medication statuses:', prescriptionError);
            }
        }

        // Send notification to the assigned provider
        const notificationController = require('./notification.controller');
        // Pharmacy notification
        if (providerId && type === 'medication') {
            try {
                const actionUrl = `/dashboard/pharmacy/prescriptions/${medicalRecord._id}`;
                console.log('Creating notification with actionUrl:', actionUrl);
                await notificationController.createNotification({
                    body: {
                        userId: providerId,
                        type: 'pharmacy_assignment',
                        title: 'New Pharmacy Request',
                        message: `You have received a new pharmacy request from ${patient.firstName} ${patient.lastName}`,
                        priority: 'high',
                        relatedEntity: {
                            id: medicalRecord._id,
                            type: 'medication'
                        },
                        actionUrl: actionUrl
                    }
                }, { status: () => ({ json: () => {} }) });
                console.log('Notification sent to pharmacy provider');
            } catch (notificationError) {
                console.error('Error sending notification:', notificationError);
            }
        }
        // Lab notification
        if (providerId && type === 'lab_result') {
            try {
                const actionUrl = `/dashboard/lab/results?id=${medicalRecord._id}`;
                const labNotificationPayload = {
                    userId: providerId,
                    type: 'lab_assignment',
                    title: 'New Lab Request',
                    message: `You have received a new lab request from ${patient.firstName} ${patient.lastName}`,
                    priority: 'high',
                    relatedEntity: {
                        id: medicalRecord._id,
                        type: 'labResult'
                    },
                    actionUrl: actionUrl
                };
                console.log('[Lab Notification] providerId:', providerId, 'type:', type, 'payload:', labNotificationPayload);
                await notificationController.createNotification({ body: labNotificationPayload }, { status: () => ({ json: () => {} }) });
                console.log('Notification sent to lab provider');
            } catch (notificationError) {
                console.error('Error sending lab notification:', notificationError);
            }
        }
        // Radiology notification
        if (providerId && type === 'imaging') {
            try {
                const actionUrl = `/dashboard/radiologist/reports?id=${medicalRecord._id}`;
                const radioNotificationPayload = {
                    userId: providerId,
                    type: 'radiology_assignment',
                    title: 'New Radiology Request',
                    message: `You have received a new radiology request from ${patient.firstName} ${patient.lastName}`,
                    priority: 'high',
                    relatedEntity: {
                        id: medicalRecord._id,
                        type: 'radiologyResult'
                    },
                    actionUrl: actionUrl
                };
                console.log('[Radiology Notification] providerId:', providerId, 'type:', type, 'payload:', radioNotificationPayload);
                await notificationController.createNotification({ body: radioNotificationPayload }, { status: () => ({ json: () => {} }) });
                console.log('Notification sent to radiology provider');
            } catch (notificationError) {
                console.error('Error sending radiology notification:', notificationError);
            }
        }

        // Populate patient and provider details
        await medicalRecord.populate('patientId', 'firstName lastName cnamId');
        await medicalRecord.populate('providerId', 'firstName lastName specialization');

        res.status(201).json({
            message: "Medical record created successfully",
            medicalRecord
        });
    } catch (err) {
        console.error('Create medical record error:', err);
        res.status(500).json({ message: "Failed to create medical record", error: err });
    }
};

export const getMedicalRecords = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        let query: any = {};
        
        if (userRole === 'patient') {
            query.patientId = userId;
            // Patients can only see records that are explicitly shared with them
            query.$or = [
                { privacyLevel: 'patient_visible' },
                { privacyLevel: 'shared' },
                { isPrivate: false, privacyLevel: { $ne: 'doctor_only' } }
            ];
        } else if (userRole === 'doctor') {
            // Doctors can only see records for patients they have consulted with
            const Appointment = require('../models/appointment.model').default;
            const User = require('../models/user.model').default;
            
            // Get distinct patient IDs from appointments where this doctor is the provider
            const consultedPatientIds = await Appointment.distinct('patientId', { 
                providerId: userId 
            });
            
            if (consultedPatientIds.length === 0) {
                // No consulted patients, return empty result
                query._id = { $in: [] };
            } else {
                // Get patients and check their consent settings
                const consultedPatients = await User.find({ 
                    _id: { $in: consultedPatientIds } 
                }).select('_id allowOtherDoctorsAccess');
                
                const patientsWithConsent = consultedPatients
                    .filter((p: any) => p.allowOtherDoctorsAccess)
                    .map((p: any) => p._id);
                
                const patientsWithoutConsent = consultedPatients
                    .filter((p: any) => !p.allowOtherDoctorsAccess)
                    .map((p: any) => p._id);
                
                // Build query based on patient consent
                const queryConditions = [];
                
                // For patients WITH consent: show all their records (shared + any other doctor's records)
                if (patientsWithConsent.length > 0) {
                    queryConditions.push({
                        $and: [
                            { patientId: { $in: patientsWithConsent } },
                            {
                                $or: [
                                    { providerId: userId }, // Records this doctor created
                                    { privacyLevel: 'shared' }, // Records shared with all providers
                                    { privacyLevel: 'patient_visible' }, // Records visible to patient (and consenting doctors)
                                    { privacyLevel: { $ne: 'doctor_only' } } // Non-private records
                                ]
                            }
                        ]
                    });
                }
                
                // For patients WITHOUT consent: only show records this doctor created + shared records
                if (patientsWithoutConsent.length > 0) {
                    queryConditions.push({
                        $and: [
                            { patientId: { $in: patientsWithoutConsent } },
                            {
                                $or: [
                                    { providerId: userId }, // Only records this doctor created
                                    { privacyLevel: 'shared' } // Records explicitly shared with all providers
                                ]
                            }
                        ]
                    });
                }
                
                if (queryConditions.length > 0) {
                    query.$or = queryConditions;
                } else {
                    // No valid conditions, return empty result
                    query._id = { $in: [] };
                }
            }
        } else if (['pharmacy', 'lab', 'radiologist'].includes(userRole)) {
            // Other providers can see records they created and records shared with them
            query.$or = [
                { providerId: userId }, // Records they created
                { privacyLevel: 'shared' }, // Records shared with all providers
                { patientId: userId } // Records where they are the patient
            ];
        } else if (userRole === 'admin') {
            // Admins can see all records
            // No additional query restrictions
        } else {
            // Other roles have no access
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const medicalRecords = await MedicalRecord.find(query)
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization')
            .sort({ date: -1, createdAt: -1 });

        res.json(medicalRecords);
    } catch (err) {
        console.error('Get medical records error:', err);
        res.status(500).json({ message: "Failed to fetch medical records", error: err });
    }
};

export const getMedicalRecordById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        // Log incoming request parameters
        console.log('[getMedicalRecordById] Incoming params:', { id, userId, userRole });
        // Defensive check for valid ObjectId
        const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(id);
        if (!isValidObjectId) {
            console.warn('[getMedicalRecordById] Invalid ObjectId:', id);
            res.status(400).json({ message: 'Invalid medical record id' });
            return;
        }
        const medicalRecord = await MedicalRecord.findById(id)
            .populate('patientId', 'firstName lastName cnamId email phone')
            .populate('providerId', 'firstName lastName specialization');

        if (!medicalRecord) {
            res.status(404).json({ message: "Medical record not found" });
            return;
        }

        // Check access permissions
        if (userRole === 'patient') {
            if (medicalRecord.patientId.toString() !== userId) {
                res.status(403).json({ message: "Access denied" });
                return;
            }
        } else if (userRole === 'doctor') {
            // Ensure patientId is always a string ObjectId
            let patientId: string;
            if (typeof medicalRecord.patientId === 'object' && medicalRecord.patientId !== null && '_id' in medicalRecord.patientId) {
                patientId = String((medicalRecord.patientId as any)._id);
            } else {
                patientId = String(medicalRecord.patientId);
            }
            
            // First check if this doctor has consulted with this patient
            const Appointment = require('../models/appointment.model').default;
            const hasConsultedPatient = await Appointment.exists({ 
                providerId: userId, 
                patientId: patientId 
            });
            
            if (!hasConsultedPatient) {
                res.status(403).json({ message: "Access denied: No consultation history with this patient" });
                return;
            }
            
            // Then check if they can see this specific record
            let providerId: string | undefined;
            if (medicalRecord.providerId && typeof medicalRecord.providerId === 'object' && '_id' in medicalRecord.providerId) {
                providerId = String((medicalRecord.providerId as any)._id);
            } else {
                providerId = String(medicalRecord.providerId);
            }
            
            // Doctor can see the record if:
            // 1. They created it, OR
            // 2. It's shared with all providers AND patient has given consent
            const isOwnRecord = providerId === userId;
            const isSharedRecord = medicalRecord.privacyLevel === 'shared';
            
            if (!isOwnRecord && !isSharedRecord) {
                // Check patient consent for other doctors' records
                const User = require('../models/user.model').default;
                const patient = await User.findById(patientId);
                
                if (!patient || !patient.allowOtherDoctorsAccess) {
                    res.status(403).json({ message: "Access denied: Patient has not granted access to other doctors' records" });
                    return;
                }
            }
        } else if (userRole === 'admin') {
            // Admins can access all records
        } else {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        res.json(medicalRecord);
    } catch (err) {
        console.error('Get medical record error:', err);
        res.status(500).json({ message: "Failed to fetch medical record", error: err });
    }
};

export const updateMedicalRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = (req as any).user.id;
        // Log incoming request parameters
        console.log('[updateMedicalRecord] Incoming params:', { id, updates, userId });
        const medicalRecord = await MedicalRecord.findById(id);
        
        if (!medicalRecord) {
            res.status(404).json({ message: "Medical record not found" });
            return;
        }

        // Only the provider who created the record can update it
        if (medicalRecord.providerId.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // Only allow certain fields to be updated
        const allowedUpdates = ['title', 'details', 'fileUrl', 'isPrivate', 'tags'];
        const filteredUpdates: any = {};
        
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });

        const updatedRecord = await MedicalRecord.findByIdAndUpdate(
            id, 
            filteredUpdates, 
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('providerId', 'firstName lastName specialization');

        res.json({
            message: "Medical record updated successfully",
            medicalRecord: updatedRecord
        });
    } catch (err) {
        console.error('Update medical record error:', err);
        res.status(500).json({ message: "Failed to update medical record", error: err });
    }
};

export const deleteMedicalRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        // Log incoming request parameters
        console.log('[deleteMedicalRecord] Incoming params:', { id, userId });
        const medicalRecord = await MedicalRecord.findById(id);
        
        if (!medicalRecord) {
            res.status(404).json({ message: "Medical record not found" });
            return;
        }

        // Only the provider who created the record can delete it
        if (medicalRecord.providerId.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        await MedicalRecord.findByIdAndDelete(id);

        res.json({
            message: "Medical record deleted successfully"
        });
    } catch (err) {
        console.error('Delete medical record error:', err);
        res.status(500).json({ message: "Failed to delete medical record", error: err });
    }
};

export const getPatientMedicalHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { doctorId } = req.query; // Optional filter for specific doctor
        // Log incoming request parameters
        console.log('[getPatientMedicalHistory] Incoming params:', { patientId, userId, userRole, doctorId });
        // Check if user has access to this patient's records
        if (userRole === 'patient' && patientId !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // For doctors: First verify they have consulted with this patient
        if (userRole === 'doctor' && patientId !== userId) {
            const Appointment = require('../models/appointment.model').default;
            
            // Check if this doctor has ever had an appointment with this patient
            const hasConsultedPatient = await Appointment.exists({ 
                providerId: userId, 
                patientId: patientId 
            });
            
            if (!hasConsultedPatient) {
                res.status(403).json({ message: "Access denied: No consultation history with this patient" });
                return;
            }
        }

        let query: any = { patientId };

        // If a doctor is requesting records for a patient they don't own
        if (userRole === 'doctor' && patientId !== userId) {
            const User = require('../models/user.model').default;
            const patient = await User.findById(patientId);
            
            if (!patient || !patient.allowOtherDoctorsAccess) {
                // If patient hasn't given consent, only show records from this doctor
                query.providerId = userId;
            }
        }

        // If doctorId is specified, filter by that doctor
        if (doctorId) {
            query.providerId = doctorId;
        }

        const medicalRecords = await MedicalRecord.find(query)
            .populate('providerId', 'firstName lastName specialization')
            .sort({ date: -1, createdAt: -1 });

        res.json(medicalRecords);
    } catch (err) {
        console.error('Get patient medical history error:', err);
        res.status(500).json({ message: "Failed to fetch patient medical history", error: err });
    }
};

export const getPatientDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Import models
        const Appointment = require('../models/appointment.model').default;
        const Prescription = require('../models/prescription.model').default;
        
        let patientId = userId;
        
        // If provider is requesting, they can view patient data
        if (userRole !== 'patient') {
            patientId = req.query.patientId || userId;
        }
        
        // Get all appointments for the patient
        const appointments = await Appointment.find({ 
            $or: [{ patientId }, { providerId: userId }] 
        })
        .populate('patientId', 'firstName lastName')
        .populate('providerId', 'firstName lastName specialization')
        .sort({ date: -1, time: -1 });

        // Get all prescriptions for the patient
        const prescriptions = await Prescription.find({ 
            $or: [{ patientId }, { providerId: userId }] 
        })
        .populate('patientId', 'firstName lastName')
        .populate('providerId', 'firstName lastName specialization')
        .populate('appointmentId', 'date time')
        .sort({ createdAt: -1 });

        // Build medical records query based on privacy settings
        let medicalRecordsQuery: any = {};
        
        if (userRole === 'patient') {
            // Patients can only see records that are explicitly shared with them
            medicalRecordsQuery = {
                patientId,
                $or: [
                    { privacyLevel: 'patient_visible' },
                    { privacyLevel: 'shared' },
                    { isPrivate: false, privacyLevel: { $ne: 'doctor_only' } }
                ]
            };
        } else {
            // Providers can see records they created and shared records
            medicalRecordsQuery = {
                $or: [
                    { providerId: userId }, // Records they created
                    { privacyLevel: 'shared' }, // Records shared with all providers
                    { patientId } // Records for this specific patient
                ]
            };
        }

        // Get all medical records for the patient with privacy filtering
        const medicalRecords = await MedicalRecord.find(medicalRecordsQuery)
        .populate('patientId', 'firstName lastName cnamId')
        .populate('providerId', 'firstName lastName specialization')
        .populate('appointmentId', 'date time')
        .sort({ date: -1, createdAt: -1 });

        // Group records by appointment
        const consultationHistory = appointments.map((appointment: any) => {
            const appointmentPrescriptions = prescriptions.filter(
                (prescription: any) => prescription.appointmentId?._id?.toString() === appointment._id.toString()
            );
            
            const appointmentRecords = medicalRecords.filter(
                (record: any) => record.appointmentId?._id?.toString() === appointment._id.toString()
            );
            
            return {
                appointment,
                prescriptions: appointmentPrescriptions,
                medicalRecords: appointmentRecords,
                totalRecords: appointmentPrescriptions.length + appointmentRecords.length
            };
        });

        // Get summary statistics
        const stats = {
            totalAppointments: appointments.length,
            totalPrescriptions: prescriptions.length,
            totalMedicalRecords: medicalRecords.length,
            upcomingAppointments: appointments.filter((apt: any) => new Date(apt.date) > new Date()).length,
            completedAppointments: appointments.filter((apt: any) => new Date(apt.date) <= new Date()).length
        };

        res.json({
            consultationHistory,
            stats,
            recentPrescriptions: prescriptions.slice(0, 5),
            recentMedicalRecords: medicalRecords.slice(0, 5)
        });
    } catch (err) {
        console.error('Get patient dashboard error:', err);
        res.status(500).json({ message: "Failed to fetch dashboard data", error: err });
    }
};

export const updateRecordPrivacy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { privacyLevel } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Only doctors can update privacy settings
        if (userRole !== 'doctor') {
            res.status(403).json({ message: "Only doctors can update record privacy" });
            return;
        }
        
        const medicalRecord = await MedicalRecord.findById(id);
        
        if (!medicalRecord) {
            res.status(404).json({ message: "Medical record not found" });
            return;
        }

        // Only the doctor who created the record can update its privacy
        if (medicalRecord.providerId.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // Validate privacy level
        const validPrivacyLevels = ['private', 'doctor_only', 'patient_visible', 'shared'];
        if (!validPrivacyLevels.includes(privacyLevel)) {
            res.status(400).json({ message: "Invalid privacy level" });
            return;
        }

        const updatedRecord = await MedicalRecord.findByIdAndUpdate(
            id, 
            { privacyLevel }, 
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('providerId', 'firstName lastName specialization');

        res.json({
            message: "Record privacy updated successfully",
            medicalRecord: updatedRecord
        });
    } catch (err) {
        console.error('Update record privacy error:', err);
        res.status(500).json({ message: "Failed to update record privacy", error: err });
    }
};

export const getDoctorNotesForPatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { doctorId } = req.query; // Optional filter for specific doctor
        
        // Only allow access for doctors or admins
        if (userRole !== 'doctor' && userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }

        // For doctors: First verify they have consulted with this patient
        if (userRole === 'doctor') {
            const Appointment = require('../models/appointment.model').default;
            
            // Check if this doctor has ever had an appointment with this patient
            const hasConsultedPatient = await Appointment.exists({ 
                providerId: userId, 
                patientId: patientId 
            });
            
            if (!hasConsultedPatient) {
                res.status(403).json({ message: "Access denied: No consultation history with this patient" });
                return;
            }
        }

        let query: any = {
            patientId,
            privacyLevel: 'doctor_only',
            type: 'consultation'
        };

        // If a doctor is requesting notes for a patient
        if (userRole === 'doctor') {
            const User = require('../models/user.model').default;
            const patient = await User.findById(patientId);
            
            if (!patient || !patient.allowOtherDoctorsAccess) {
                // If patient hasn't given consent, only show notes from this doctor
                query.providerId = userId;
            }
        }

        // If doctorId is specified, filter by that doctor
        if (doctorId) {
            query.providerId = doctorId;
        }

        const notes = await MedicalRecord.find(query)
            .populate('providerId', 'firstName lastName specialization')
            .sort({ date: -1, createdAt: -1 });
        
        res.json(notes);
    } catch (err) {
        console.error('Get doctor notes error:', err);
        res.status(500).json({ message: 'Failed to fetch doctor notes', error: err });
    }
};

export const assignProviderToSection = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { type, providerId } = req.body;
        const userId = (req as any).user.id;
        // Log incoming request parameters
        console.log('[assignProviderToSection] Incoming params:', { id, type, providerId, userId });
        const allowedTypes = ['pharmacy', 'lab', 'radiologist'];
        if (!type || !allowedTypes.includes(type) || !providerId) {
            res.status(400).json({ message: 'Invalid type or providerId' });
            return;
        }
        const record = await MedicalRecord.findById(id).populate('patientId', 'firstName lastName');
        if (!record) {
            res.status(404).json({ message: 'Medical record not found' });
            return;
        }
        // Only the patient can assign providers for their own records
        if (record.patientId.toString() !== userId) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        // Assign provider
        if (!record.details) record.details = {};
        if (type === 'pharmacy') {
            record.details.assignedPharmacyId = providerId;
        } else if (type === 'lab') {
            record.details.assignedLabId = providerId;
        } else if (type === 'radiologist' || type === 'radiology') {
            record.details.assignedRadiologistId = providerId;
        }
        await record.save();
        res.json({ message: 'Provider assigned successfully', medicalRecord: record });
    } catch (err) {
        console.error('Assign provider error:', err);
        res.status(500).json({ message: 'Failed to assign provider', error: err });
    }
};

export const getMedicalRecordsByPrescriptionId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { prescriptionId } = req.params;
        // Log incoming request parameters
        console.log('[getMedicalRecordsByPrescriptionId] Incoming params:', { prescriptionId });
        if (!prescriptionId) {
            res.status(400).json({ message: 'Missing prescriptionId' });
            return;
        }
        // Mutual search: top-level prescriptionId OR details.prescriptionId
        const records = await MedicalRecord.find({
            $or: [
                { prescriptionId },
                { 'details.prescriptionId': prescriptionId }
            ]
        })
            .populate('providerId', 'firstName lastName specialization')
            .populate('patientId', 'firstName lastName cnamId');
        res.json(records);
    } catch (err) {
        console.error('Get medical records by prescriptionId error:', err);
        res.status(500).json({ message: 'Failed to fetch records', error: err });
    }
};

export const getAssignedRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        // Log incoming request parameters
        console.log('[getAssignedRequests] Incoming params:', { userId, userRole });
        // Only providers can use this endpoint
        if (!['pharmacy', 'lab', 'radiologist'].includes(userRole)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        // Fetch records assigned to this provider
        let records: any[] = [];
        if (userRole === 'pharmacy') {
            console.log('[Pharmacy Dashboard] Query:', {
                type: 'medication',
                $or: [
                    { providerId: userId },
                    { 'details.assignedPharmacyId': userId }
                ]
            });
            records = await MedicalRecord.find({
                type: 'medication',
                $or: [
                    { providerId: userId },
                    { 'details.assignedPharmacyId': userId }
                ]
            })
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization');
            
            // Now populate the original prescribing doctor information
            for (let record of records) {
                if (record.details?.prescriptionId) {
                    try {
                        const Prescription = require('../models/prescription.model').default;
                        const prescription = await Prescription.findById(record.details.prescriptionId)
                            .populate('providerId', 'firstName lastName specialization');
                        if (prescription) {
                            (record as any).originalDoctor = prescription.providerId;
                            // Also store in details for better serialization through API
                            if (!record.details) record.details = {};
                            record.details.originalDoctor = prescription.providerId;
                        }
                    } catch (err) {
                        console.error('Error populating original doctor for pharmacy record:', err);
                    }
                }
            }
            console.log('[Pharmacy Dashboard] Raw records:', records);
        } else if (userRole === 'lab') {
            console.log('[Lab Dashboard] Query:', {
                type: 'lab_result',
                "$or": [{ providerId: userId }, { 'details.assignedLabId': userId }]
            });
            records = await MedicalRecord.find({
                type: 'lab_result',
                $or: [
                    { providerId: userId },
                    { 'details.assignedLabId': userId }
                ]
            })
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization');
            
            // Populate the original prescribing doctor information
            for (let record of records) {
                if (record.details?.prescriptionId) {
                    try {
                        const Prescription = require('../models/prescription.model').default;
                        const prescription = await Prescription.findById(record.details.prescriptionId)
                            .populate('providerId', 'firstName lastName specialization');
                        if (prescription) {
                            (record as any).originalDoctor = prescription.providerId;
                            // Also store in details for better serialization through API
                            if (!record.details) record.details = {};
                            record.details.originalDoctor = prescription.providerId;
                        }
                    } catch (err) {
                        console.error('Error populating original doctor for lab record:', err);
                    }
                }
            }
            console.log('[Lab Dashboard] Raw records:', records);
        } else if (userRole === 'radiologist') {
            console.log('[Radiologist Dashboard] Query:', {
                type: 'imaging',
                "$or": [{ providerId: userId }, { 'details.assignedRadiologistId': userId }]
            });
            records = await MedicalRecord.find({
                type: 'imaging',
                $or: [
                    { providerId: userId },
                    { 'details.assignedRadiologistId': userId }
                ]
            })
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization');
            
            // Populate the original prescribing doctor information
            for (let record of records) {
                if (record.details?.prescriptionId) {
                    try {
                        const Prescription = require('../models/prescription.model').default;
                        const prescription = await Prescription.findById(record.details.prescriptionId)
                            .populate('providerId', 'firstName lastName specialization');
                        if (prescription) {
                            (record as any).originalDoctor = prescription.providerId;
                            // Also store in details for better serialization through API
                            if (!record.details) record.details = {};
                            record.details.originalDoctor = prescription.providerId;
                        }
                    } catch (err) {
                        console.error('Error populating original doctor for radiology record:', err);
                    }
                }
            }
            console.log('[Radiologist Dashboard] Raw records:', records);
        }
        // Filter out records with missing required fields and log them
        const validRecords = [];
        for (const rec of records) {
            try {
                if (!rec) {
                    console.warn('[Pharmacy Dashboard] Skipping null/undefined record:', rec);
                    continue;
                }
                if (!rec.patientId) {
                    console.warn('[Pharmacy Dashboard] Record missing patientId:', rec);
                    continue;
                }
                if (!rec.providerId) {
                    console.warn('[Pharmacy Dashboard] Record missing providerId:', rec);
                    continue;
                }
                if (!rec.type) {
                    console.warn('[Pharmacy Dashboard] Record missing type:', rec);
                    continue;
                }
                if (!rec.details) {
                    console.warn('[Pharmacy Dashboard] Record missing details:', rec);
                    continue;
                }
                validRecords.push(rec);
            } catch (recordErr) {
                console.error('[Pharmacy Dashboard] Error processing assigned record:', recordErr, rec);
            }
        }
        if (validRecords.length === 0) {
            console.error('[Pharmacy Dashboard] No valid assigned records found. Original records:', records);
        } else {
            console.log('[Pharmacy Dashboard] Valid records:', validRecords);
        }
        res.json(validRecords);
    } catch (err: any) {
        console.error('[Pharmacy Dashboard] Get assigned requests error:', err);
        if (err && err.stack) {
            console.error('[Pharmacy Dashboard] Error stack:', err.stack);
        }
        res.status(500).json({ message: 'Failed to fetch assigned requests', error: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) });
    }
};

export const fulfillAssignedRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { status, feedback, resultFileUrl, medications, tests, exams }: { 
            status?: string; 
            feedback?: string; 
            resultFileUrl?: string; 
            medications?: MedicationFulfillment[];
            tests?: any[];
            exams?: any[];
        } = req.body;
        // Only providers can fulfill requests
        if (!['pharmacy', 'lab', 'radiologist'].includes(userRole)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        const record = await MedicalRecord.findById(id);
        if (!record) {
            res.status(404).json({ message: 'Medical record not found' });
            return;
        }
        if (record.providerId.toString() !== userId) {
            res.status(403).json({ message: 'You are not assigned to this request' });
            return;
        }
        // Only allow valid status transitions
        // Updated logic: Per-medication availability and automatic status transitions
        const validTransitions: Record<string, string[]> = {
            pending: ['confirmed', 'ready_for_pickup', 'cancelled', 'partially_fulfilled', 'out_of_stock', 'pending_patient_confirmation'],
            pending_patient_confirmation: ['partially_fulfilled', 'cancelled'],
            confirmed: ['ready_for_pickup', 'cancelled'],
            partially_fulfilled: ['ready_for_pickup', 'cancelled'],
            out_of_stock: ['cancelled'],
            ready_for_pickup: ['completed', 'cancelled'],
        };

        // If medications array is provided, update per-medication availability and status
        if (Array.isArray(medications)) {
            console.log('[fulfillAssignedRequest] Medications received:', medications);
            
            // Check if we need to merge with existing medication details
            if (record.details && Array.isArray(record.details.medications)) {
                // Create a map of existing medications by name for fast lookup
                const existingMedsMap: Record<string, any> = {};
                record.details.medications.forEach((med: any) => {
                    if (med && med.name) {
                        existingMedsMap[med.name] = med;
                    }
                });
                
                // Update medications while preserving all details
                record.details.medications = medications.map((m: any) => {
                    const existing = m && m.name ? existingMedsMap[m.name] : undefined;
                    // Determine the correct status based on availability and current operation
                    let medStatus = existing?.status || 'pending';
                    if (!m.available) {
                        medStatus = 'unavailable';
                    } else if (status === 'confirmed') {
                        medStatus = 'confirmed';
                    } else if (status === 'ready_for_pickup') {
                        medStatus = 'ready_for_pickup';
                    } else if (status === 'completed') {
                        medStatus = 'collected';  // Change to 'collected' to match frontend
                    }
                    
                    // Make sure we have all the medication details
                    return {
                        name: m.name || existing?.name,
                        dosage: m.dosage || existing?.dosage || '',
                        frequency: m.frequency || existing?.frequency || '',
                        duration: m.duration || existing?.duration || '',
                        instructions: m.instructions || existing?.instructions || '',
                        notes: m.notes || existing?.notes || '',
                        available: m.available !== undefined ? m.available : true,
                        status: medStatus,
                        transactionId: m.transactionId || existing?.transactionId || undefined,
                        // Additional fields if any
                        ...existing, // Add any other fields we didn't explicitly handle
                        ...m, // But still let incoming updates override
                    };
                });
            } else {
                // If no existing medications, ensure each has proper status and complete structure
                record.details.medications = medications.map((m: any) => ({
                    name: m.name || '',
                    dosage: m.dosage || '',
                    frequency: m.frequency || '',
                    duration: m.duration || '',
                    instructions: m.instructions || '',
                    notes: m.notes || '',
                    available: m.available !== undefined ? m.available : true,
                    status: m.available ? (status || 'confirmed') : 'unavailable',
                    transactionId: m.transactionId || undefined,
                    ...m, // Include any other fields provided
                }));
            }
            
            const allAvailable = medications.every((m: MedicationFulfillment) => m.available === true);
            const allUnavailable = medications.every((m: MedicationFulfillment) => m.available === false);
            if (record.status === 'pending') {
                if (allAvailable) {
                    record.status = 'confirmed';
                } else if (allUnavailable) {
                    record.status = 'out_of_stock';
                    record.details.feedback = medications.map((m: any) => m.name).join(', ');
                } else {
                    // Use pending_patient_confirmation instead of partially_fulfilled to wait for patient's confirmation
                    record.status = 'pending_patient_confirmation';
                    record.details.feedback = medications.filter((m: any) => !m.available).map((m: any) => m.name).join(', ');
                }
                record.markModified('details');
            }
        }
        
        // Update lab test statuses if specific tests were provided
        if (record.type === 'lab_result' && record.details && Array.isArray(record.details.labTests)) {
            // If specific test updates were provided, merge them
            if (Array.isArray(tests)) {
                const testMap: Record<string, any> = {};
                record.details.labTests.forEach((test: any) => {
                    if (test && (test.testName || test.name)) {
                        testMap[test.testName || test.name] = test;
                    }
                });
                
                // Update tests with provided data
                tests.forEach((t: any) => {
                    const testName = t.testName || t.name;
                    if (testName && testMap[testName]) {
                        const existingTest = testMap[testName];
                        Object.assign(existingTest, t);
                        if (t.available !== undefined) {
                            existingTest.status = t.available ? 'confirmed' : 'unavailable';
                        }
                    }
                });
                
                // Handle feedback for lab tests the same way as medications
                if (record.status === 'pending') {
                    const allAvailable = tests.every((t: any) => t.available === true);
                    const allUnavailable = tests.every((t: any) => t.available === false);
                    
                    if (allAvailable) {
                        record.status = 'confirmed';
                    } else if (allUnavailable) {
                        record.status = 'out_of_stock';
                        // Store detailed feedback including unavailable test names
                        record.details.feedback = tests.filter((t: any) => !t.available)
                            .map((t: any) => t.testName || t.name)
                            .join(', ');
                    } else {
                        record.status = 'pending_patient_confirmation';
                        // Store detailed feedback including unavailable test names
                        record.details.feedback = tests.filter((t: any) => !t.available)
                            .map((t: any) => t.testName || t.name)
                            .join(', ');
                    }
                }
                
                // If feedback parameter was provided directly, use that
                if (feedback) {
                    record.details.feedback = feedback;
                }
                
                record.markModified('details');
            }
        }
        
        // Update radiology exam statuses if specific exams were provided
        if (record.type === 'imaging' && record.details && Array.isArray(record.details.radiology)) {
            // If specific exam updates were provided, merge them
            if (Array.isArray(exams)) {
                const examMap: Record<string, any> = {};
                record.details.radiology.forEach((exam: any) => {
                    if (exam && (exam.examName || exam.name)) {
                        examMap[exam.examName || exam.name] = exam;
                    }
                });
                
                // Update exams with provided data
                exams.forEach((e: any) => {
                    const examName = e.examName || e.name;
                    if (examName && examMap[examName]) {
                        const existingExam = examMap[examName];
                        Object.assign(existingExam, e);
                        if (e.available !== undefined) {
                            existingExam.status = e.available ? 'confirmed' : 'unavailable';
                        }
                    }
                });
                
                // Handle feedback for radiology exams the same way as medications
                if (record.status === 'pending') {
                    const allAvailable = exams.every((e: any) => e.available === true);
                    const allUnavailable = exams.every((e: any) => e.available === false);
                    
                    if (allAvailable) {
                        record.status = 'confirmed';
                    } else if (allUnavailable) {
                        record.status = 'out_of_stock';
                        // Store detailed feedback including unavailable exam names
                        record.details.feedback = exams.filter((e: any) => !e.available)
                            .map((e: any) => e.examName || e.name)
                            .join(', ');
                    } else {
                        record.status = 'pending_patient_confirmation';
                        // Store detailed feedback including unavailable exam names
                        record.details.feedback = exams.filter((e: any) => !e.available)
                            .map((e: any) => e.examName || e.name)
                            .join(', ');
                    }
                }
                
                // If feedback parameter was provided directly, use that
                if (feedback) {
                    record.details.feedback = feedback;
                }
                
                record.markModified('details');
            }
        }

        // Handle explicit status transitions (e.g., pharmacist clicks 'Order Prepared')
        if (status && record.status !== status) {
            const allowed = validTransitions[record.status] || [];
            if (typeof status === 'string' && !allowed.includes(status)) {
                res.status(400).json({ message: `Invalid status transition from ${record.status} to ${status}` });
                return;
            }
            // If pharmacist is setting partial/out_of_stock, require feedback
            if (typeof status === 'string' && ['partially_fulfilled', 'out_of_stock'].includes(status)) {
                if (!feedback || typeof feedback !== 'string' || feedback.trim() === '') {
                    res.status(400).json({ message: 'Feedback specifying unavailable medications is required.' });
                    return;
                }
                record.details.feedback = feedback;
                record.markModified('details');
            }
            // If pharmacist sets ready_for_pickup, clear feedback
            if (status === 'ready_for_pickup') {
                record.details.feedback = '';
                record.markModified('details');
            }

            // Update lab test statuses when record status changes
            if (record.type === 'lab_result' && record.details && Array.isArray(record.details.labTests)) {
                record.details.labTests = record.details.labTests.map((test: any) => {
                    let testStatus = test.status || 'pending';
                    
                    // Only update status for available tests
                    if (test.available !== false) {
                        if (status === 'confirmed') {
                            testStatus = 'confirmed';
                        } else if (status === 'ready_for_pickup') {
                            testStatus = 'ready_for_pickup';
                        } else if (status === 'completed') {
                            testStatus = 'collected';  // Change to 'collected' for consistency with medications
                        }
                    } else {
                        // Keep unavailable tests as unavailable
                        testStatus = 'unavailable';
                    }
                    
                    return {
                        ...test,
                        status: testStatus
                    };
                });
                record.markModified('details');
            }
            
            // Update radiology exam statuses when record status changes
            if (record.type === 'imaging' && record.details && Array.isArray(record.details.radiology)) {
                record.details.radiology = record.details.radiology.map((exam: any) => {
                    let examStatus = exam.status || 'pending';
                    
                    // Only update status for available exams
                    if (exam.available !== false) {
                        if (status === 'confirmed') {
                            examStatus = 'confirmed';
                        } else if (status === 'ready_for_pickup') {
                            examStatus = 'ready_for_pickup';
                        } else if (status === 'completed') {
                            examStatus = 'collected';  // Change to 'collected' for consistency with medications
                        }
                    } else {
                        // Keep unavailable exams as unavailable
                        examStatus = 'unavailable';
                    }
                    
                    return {
                        ...exam,
                        status: examStatus
                    };
                });
                record.markModified('details');
            }
            
            // If pharmacist sets confirmed, also update medication statuses
            if (status === 'confirmed' && record.type === 'prescription' && record.details && Array.isArray(record.details.medications)) {
                record.details.medications = record.details.medications.map((med: any) => {
                    return {
                        ...med,
                        status: med.available !== false ? 'confirmed' : 'unavailable'
                    };
                });
                record.markModified('details');
            }
            
            // If status is completed, update all available medications to collected
            if (status === 'completed' && record.type === 'medication' && record.details && Array.isArray(record.details.medications)) {
                record.details.medications = record.details.medications.map((med: any) => {
                    // Only update status for available medications
                    if (med.available !== false) {
                        return {
                            ...med,
                            status: 'collected'
                        };
                    }
                    return med;
                });
                record.markModified('details');
            }
            
            record.status = status as typeof record.status;
        }
        // Allow updating feedback if provided (for patient acceptance)
        if (feedback && typeof status === 'string' && !['partially_fulfilled', 'out_of_stock'].includes(status)) {
            record.details.feedback = feedback;
            record.markModified('details');
        }
        if (resultFileUrl) record.details.resultFileUrl = resultFileUrl;
        await record.save();
        // TODO: Trigger notification to patient on status change
        res.json({ message: 'Request updated', medicalRecord: record });
    } catch (err) {
        console.error('Fulfill assigned request error:', err);
        res.status(500).json({ message: 'Failed to fulfill request', error: err });
    }
};

export const cancelMedicalRecordRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const record = await MedicalRecord.findById(id);
        if (!record) {
            res.status(404).json({ message: 'Medical record not found' });
            return;
        }
        // Only the patient can cancel their own request
        if (record.patientId.toString() !== userId) {
            res.status(403).json({ message: 'Only the patient can cancel this request' });
            return;
        }
        // Only allow cancellation if status is pending, ready_for_pickup, partially_fulfilled, or out_of_stock
        if (!['pending', 'ready_for_pickup', 'partially_fulfilled', 'out_of_stock', 'pending_patient_confirmation'].includes(record.status)) {
            res.status(400).json({ message: `Cannot cancel a request with status '${record.status}'` });
            return;
        }
        record.status = 'cancelled';
        await record.save();
        res.json({ message: 'Request cancelled', medicalRecord: record });
    } catch (err) {
        console.error('Cancel medical record request error:', err);
        res.status(500).json({ message: 'Failed to cancel request', error: err });
    }
};

export const confirmPartialFulfillment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const record = await MedicalRecord.findById(id);
        if (!record) {
            res.status(404).json({ message: 'Medical record not found' });
            return;
        }
        
        // Only the patient can confirm their own request
        if (record.patientId.toString() !== userId) {
            res.status(403).json({ message: 'Only the patient can confirm this request' });
            return;
        }
        
        // Only allow confirmation if status is pending_patient_confirmation
        if (record.status !== 'pending_patient_confirmation') {
            res.status(400).json({ message: `Cannot confirm a request with status '${record.status}'` });
            return;
        }
        
        // Change status to partially_fulfilled to indicate patient has confirmed
        record.status = 'partially_fulfilled';
        await record.save();
        
        // Send notification to provider based on record type
        const notificationController = require('./notification.controller');
        
        let notificationType = 'medication';
        let message = 'Patient has confirmed the partial medication order.';
        let actionUrl = '/dashboard/pharmacy/prescriptions';
        
        // Determine notification details based on record type
        if (record.type === 'lab_result') {
            notificationType = 'lab_result';
            message = 'Patient has confirmed the partial lab tests order.';
            actionUrl = '/dashboard/lab/requests';
        } else if (record.type === 'imaging') {
            notificationType = 'imaging';
            message = 'Patient has confirmed the partial radiology exams order.';
            actionUrl = '/dashboard/radiology/requests';
        }
        
        try {
            // Extract provider ID correctly whether it's an object or a string
            const providerId = typeof record.providerId === 'object' ? 
                (record.providerId._id ? record.providerId._id : record.providerId) : 
                record.providerId;
            
            console.log('[confirmPartialFulfillment] Sending notification to provider:', providerId);
            
            await notificationController.createNotification({
                body: {
                    userId: providerId,
                    type: 'patient_confirmed_partial',
                    title: 'Patient Confirmed Partial Order',
                    message: message,
                    priority: 'high',
                    relatedEntity: {
                        id: record._id,
                        type: record.type // Use the actual record type (medication, lab_result, imaging)
                    },
                    data: {
                        recordId: record._id,
                        status: 'partially_fulfilled'
                    },
                    actionUrl: actionUrl
                }
            }, { status: () => ({ json: () => {} }) });
        } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
        }
        
        res.json({ 
            message: 'Partial fulfillment confirmed', 
            medicalRecord: record 
        });
    } catch (err) {
        console.error('Confirm partial fulfillment error:', err);
        res.status(500).json({ message: 'Failed to confirm partial fulfillment', error: err });
    }
};

export const reassignPharmacyForMedicalRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { pharmacyId } = req.body;
        const userId = (req as any).user.id;
        const record = await MedicalRecord.findById(id);
        if (!record) {
            res.status(404).json({ message: 'Medical record not found' });
            return;
        }
        // Only the patient can reassign
        if (record.patientId.toString() !== userId) {
            res.status(403).json({ message: 'Only the patient can reassign this request' });
            return;
        }
        // Only allowed if status is partially_fulfilled or out_of_stock
        if (!['partially_fulfilled', 'out_of_stock'].includes(record.status)) {
            res.status(400).json({ message: `Cannot reassign a request with status '${record.status}'` });
            return;
        }
        if (!pharmacyId) {
            res.status(400).json({ message: 'pharmacyId is required' });
            return;
        }
        // Do NOT create a new medical record. Update the existing one.
        record.providerId = pharmacyId;
        if (!record.details) record.details = {};
        record.details.assignedPharmacyId = pharmacyId;
        record.status = 'pending';
        // Clear feedback and any fulfillment info
        record.details.feedback = '';
        record.details.resultFileUrl = '';
        record.markModified('details');
        await record.save();
        res.json({ message: 'Pharmacy reassigned and request reset to pending', medicalRecord: record });
    } catch (err) {
        console.error('Reassign pharmacy error:', err);
        res.status(500).json({ message: 'Failed to reassign pharmacy', error: err });
    }
};

export const uploadLabRadiologyReport = [
  upload.array('files', 10), // up to 10 files
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { report, status } = req.body;
      const userId = req.user.id;

      const record = await MedicalRecord.findById(id);
      if (!record) return res.status(404).json({ message: 'Medical record not found' });

      // Only assigned provider can upload
      if (record.providerId.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Validate type
      if (!['lab_result', 'imaging'].includes(record.type)) {
        return res.status(400).json({ message: 'Only lab_result or imaging records can accept uploads' });
      }

      // Handle files
      const files = (req.files || []).map((file: any) => ({
        filename: file.filename,
        url: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        uploadedAt: new Date()
      }));
      if (files.length > 0) {
        files.forEach((f: any) => record.files.push(f));
      }

      // Handle structured report
      if (report) {
        let parsedReport = report;
        if (typeof report === 'string') {
          try { parsedReport = JSON.parse(report); } catch {}
        }
        record.report = parsedReport;
      }

      // Optionally update status
      if (status && record.status !== status) {
        record.status = status;
      }

      await record.save();
      res.json({ message: 'Report uploaded', medicalRecord: record });
    } catch (err) {
      console.error('Upload lab/radiology report error:', err);
      res.status(500).json({ message: 'Failed to upload report', error: err });
    }
  }
];