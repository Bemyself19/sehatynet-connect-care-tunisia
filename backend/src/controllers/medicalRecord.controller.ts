import { Request, Response } from "express";
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
            } else if (type === 'prescription') {
                finalPrivacyLevel = 'patient_visible'; // Prescriptions are visible to patients
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
        if (type === 'prescription' && prescriptionId) {
            const existing = await MedicalRecord.findOne({
                type: 'prescription',
                patientId,
                prescriptionId,
                status: { $ne: 'cancelled' }
            });
            if (existing) {
                res.status(400).json({ message: 'A pharmacy request for this prescription already exists.' });
                return;
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
            prescriptionId: prescriptionId || undefined
        });

        // Ensure assigned provider fields are set for new records
        if (type === 'prescription' && providerId) {
            if (!details.assignedPharmacyId) details.assignedPharmacyId = providerId;
        }
        if (type === 'lab_result' && providerId) {
            if (!details.assignedLabId) details.assignedLabId = providerId;
        }
        if (type === 'imaging' && providerId) {
            if (!details.assignedRadiologistId) details.assignedRadiologistId = providerId;
        }

        await medicalRecord.save();

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
        } else if (['doctor', 'pharmacy', 'lab', 'radiologist'].includes(userRole)) {
            // Providers can see records they created (including private ones)
            // and records shared with them
            query.$or = [
                { providerId: userId }, // Records they created
                { privacyLevel: 'shared' }, // Records shared with all providers
                { patientId: userId } // Records where they are the patient
            ];
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
            let providerId: string | undefined;
            if (medicalRecord.providerId && typeof medicalRecord.providerId === 'object' && '_id' in medicalRecord.providerId) {
                providerId = String((medicalRecord.providerId as any)._id);
            } else {
                providerId = String(medicalRecord.providerId);
            }
            if (providerId !== userId) {
                console.log('Access denied: doctor', userId, 'providerId', providerId, 'raw providerId:', medicalRecord.providerId);
                res.status(403).json({ message: "Access denied" });
                return;
            }
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
        
        // Check if user has access to this patient's records
        if (userRole === 'patient' && patientId !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const medicalRecords = await MedicalRecord.find({ patientId })
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
        // Only allow access for doctors or the provider themselves
        const userRole = (req as any).user.role;
        if (userRole !== 'doctor' && userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        const notes = await MedicalRecord.find({
            patientId,
            privacyLevel: 'doctor_only',
            type: 'consultation'
        })
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
        const allowedTypes = ['pharmacy', 'lab', 'radiologist'];
        if (!type || !allowedTypes.includes(type) || !providerId) {
            res.status(400).json({ message: 'Invalid type or providerId' });
            return;
        }
        const record = await MedicalRecord.findById(id);
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
        if (!prescriptionId) {
            res.status(400).json({ message: 'Missing prescriptionId' });
            return;
        }
        const records = await MedicalRecord.find({ prescriptionId })
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
        // Only providers can use this endpoint
        if (!['pharmacy', 'lab', 'radiologist'].includes(userRole)) {
            res.status(403).json({ message: 'Access denied' });
            return;
        }
        // Fetch records assigned to this provider
        let records;
        if (userRole === 'pharmacy') {
            records = await MedicalRecord.find({
                type: 'prescription',
                $or: [
                    { providerId: userId },
                    { 'details.assignedPharmacyId': userId }
                ]
            })
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization');
        } else if (userRole === 'lab') {
            records = await MedicalRecord.find({
                type: 'lab_result',
                providerId: userId
            })
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization');
        } else if (userRole === 'radiologist') {
            records = await MedicalRecord.find({
                type: 'imaging',
                providerId: userId
            })
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization');
        }
        res.json(records);
    } catch (err) {
        console.error('Get assigned requests error:', err);
        res.status(500).json({ message: 'Failed to fetch assigned requests', error: err });
    }
};

export const fulfillAssignedRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { status, feedback, resultFileUrl } = req.body;
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
        const validTransitions: Record<string, string[]> = {
            pending: ['ready_for_pickup', 'cancelled', 'partially_fulfilled', 'out_of_stock'],
            partially_fulfilled: ['ready_for_pickup', 'cancelled'], // patient can accept or cancel
            out_of_stock: ['cancelled'], // patient can only cancel or reassign
            ready_for_pickup: ['completed', 'cancelled'],
        };
        if (status && record.status !== status) {
            const allowed = validTransitions[record.status] || [];
            if (!allowed.includes(status)) {
                res.status(400).json({ message: `Invalid status transition from ${record.status} to ${status}` });
                return;
            }
            // If pharmacist is setting partial/out_of_stock, require feedback
            if (['partially_fulfilled', 'out_of_stock'].includes(status)) {
                if (!feedback || typeof feedback !== 'string' || feedback.trim() === '') {
                    res.status(400).json({ message: 'Feedback specifying unavailable medications is required.' });
                    return;
                }
            }
            record.status = status;
        }
        if (feedback) {
            record.details.feedback = feedback;
            record.markModified('details');
        }
        if (resultFileUrl) record.details.resultFileUrl = resultFileUrl;
        await record.save();
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
        if (!['pending', 'ready_for_pickup', 'partially_fulfilled', 'out_of_stock'].includes(record.status)) {
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
        record.providerId = pharmacyId;
        if (!record.details) record.details = {};
        record.details.assignedPharmacyId = pharmacyId;
        record.status = 'pending';
        record.details.feedback = '';
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