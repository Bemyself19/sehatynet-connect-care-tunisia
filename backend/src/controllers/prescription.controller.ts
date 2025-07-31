// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor only)
export const createPrescription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId, appointmentId, medications = [], labTests = [], radiology = [], notes } = req.body;
        const providerId = (req as any).user.id;
        if (!patientId || !appointmentId || (
          (!medications || medications.length === 0) &&
          (!labTests || labTests.length === 0) &&
          (!radiology || radiology.length === 0)
        )) {
            res.status(400).json({ message: "Missing required prescription fields: at least one section must be filled" });
            return;
        }
        const patient = await User.findById(patientId);
        const appointment = await Appointment.findById(appointmentId);
        if (!patient || !appointment) {
            res.status(404).json({ message: "Patient or Appointment not found" });
            return;
        }
        const prescription = new Prescription({
            patientId,
            providerId,
            appointmentId,
            medications,
            labTests,
            radiology,
            notes
        });
        const savedPrescription = await prescription.save();
        const details: any = {
          prescriptionId: savedPrescription._id,
          medications: medications || [],
          labTests: labTests || [],
          radiologyExams: radiology || []
        };
        const medicalRecord = new MedicalRecord({
            patientId,
            providerId,
            appointmentId,
            title: "Prescription",
            type: "prescription",
            date: new Date(),
            details
        });
        await medicalRecord.save();
        await notify({
          userId: patientId,
          type: 'prescription_ready',
          title: 'New Prescription',
          message: 'A new prescription has been created for you.',
          relatedEntity: { type: 'prescription', id: savedPrescription._id },
          actionUrl: `/dashboard/patient/medical-records?open=${medicalRecord._id}`
        });
        res.status(201).json({
            message: "Prescription created successfully",
            prescription: savedPrescription
        });
    } catch (err) {
        console.error('Create prescription error:', err);
        res.status(500).json({ message: "Failed to create prescription", error: err });
    }
};

// @desc    Provider sets item as ready for pickup
// @route   PATCH /api/prescriptions/:id/item/ready-for-pickup
// @access  Private (Provider)
export const setItemReadyForPickup = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { type, itemIndex } = req.body;
        if (!['medication', 'lab', 'radiology'].includes(type) || typeof itemIndex !== 'number') {
            res.status(400).json({ message: 'type (medication|lab|radiology) and itemIndex (number) are required' });
            return;
        }
        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }
        let item: any = undefined;
        if (type === 'medication') item = prescription.medications[itemIndex];
        else if (type === 'lab') item = prescription.labTests[itemIndex];
        else if (type === 'radiology') item = prescription.radiology[itemIndex];
        if (!item) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }
        if (!['confirmed', 'partial_accepted'].includes(item.status)) {
            res.status(400).json({ message: 'Item must be confirmed or partial_accepted to be set as ready for pickup' });
            return;
        }
        item.status = 'ready_for_pickup';
        if (!item.history) item.history = [];
        item.history.push({
            status: 'ready_for_pickup',
            date: new Date(),
            by: (req as any).user.id
        });
        await prescription.save();
        await notify({
            userId: prescription.patientId,
            type: 'prescription_updated',
            title: 'Order Ready for Pickup',
            message: 'Your prescription item is ready for pickup.',
            relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Item marked as ready for pickup', prescription });
    } catch (err) {
        console.error('Set ready for pickup error:', err);
        res.status(500).json({ message: 'Failed to set ready for pickup', error: err });
    }
};

// @desc    Provider marks item as completed (picked up by patient), generates transactionId
// @route   PATCH /api/prescriptions/:id/item/complete
// @access  Private (Provider)
export const setItemCompleted = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { type, itemIndex } = req.body;
        if (!['medication', 'lab', 'radiology'].includes(type) || typeof itemIndex !== 'number') {
            res.status(400).json({ message: 'type (medication|lab|radiology) and itemIndex (number) are required' });
            return;
        }
        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }
        let item: any = undefined;
        if (type === 'medication') item = prescription.medications[itemIndex];
        else if (type === 'lab') item = prescription.labTests[itemIndex];
        else if (type === 'radiology') item = prescription.radiology[itemIndex];
        if (!item) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }
        if (item.status !== 'ready_for_pickup') {
            res.status(400).json({ message: 'Item must be ready for pickup to be completed' });
            return;
        }
        item.status = 'completed';
        if (!item.transactionId) {
            item.transactionId = generateTransactionId();
        }
        if (!item.history) item.history = [];
        item.history.push({
            status: 'completed',
            date: new Date(),
            by: (req as any).user.id
        });
        await prescription.save();
        await notify({
            userId: prescription.patientId,
            type: 'prescription_updated',
            title: 'Order Completed',
            message: `Your prescription item has been picked up. Transaction ID: ${item.transactionId}`,
            relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Item marked as completed', transactionId: item.transactionId, prescription });
    } catch (err) {
        console.error('Set completed error:', err);
        res.status(500).json({ message: 'Failed to set completed', error: err });
    }
};

import { Request, Response } from "express";
import Prescription from "../models/prescription.model";
import User from "../models/user.model";
import Appointment from "../models/appointment.model";
import MedicalRecord from "../models/medicalRecord.model";
import Notification from '../models/notification.model';
import PDFDocument from 'pdfkit';
import stream from 'stream';

// Utility to generate a transactionId (simple random string, can be replaced with your logic)
function generateTransactionId() {
  return 'TX-' + Math.random().toString(36).substr(2, 9).toUpperCase() + '-' + Date.now();
}

// Utility to create a notification
interface NotifyOptions {
  userId: any;
  type: string;
  title: string;
  message: string;
  priority?: string;
  relatedEntity?: any;
  actionUrl?: string;
}

async function notify({ userId, type, title, message, priority = 'medium', relatedEntity, actionUrl }: NotifyOptions) {
  try {
    await Notification.create({ userId, type, title, message, priority, relatedEntity, actionUrl, isRead: false });
  } catch (err) {
    console.error('Notification error:', err);
  }
}

// ...existing code (all controller functions, starting with createPrescription, go here)...
// @desc    Patient reassigns provider for a medication, lab, or radiology item (if partial/rejected)
// @route   PATCH /api/prescriptions/:id/reassign
// @access  Private (Patient)
export const reassignPrescriptionItem = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { type, itemIndex, newProviderId } = req.body;
        if (!['medication', 'lab', 'radiology'].includes(type) || typeof itemIndex !== 'number' || !newProviderId) {
            res.status(400).json({ message: 'type (medication|lab|radiology), itemIndex (number), and newProviderId are required' });
            return;
        }

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }

        // Only patient can reassign their own prescription
        if ((req as any).user.id !== prescription.patientId.toString()) {
            res.status(403).json({ message: 'Not authorized to reassign this prescription' });
            return;
        }

        let item: any = undefined, providerRole: string = '';
        if (type === 'medication') {
            item = prescription.medications[itemIndex];
            providerRole = 'pharmacy';
        } else if (type === 'lab') {
            item = prescription.labTests[itemIndex];
            providerRole = 'lab';
        } else if (type === 'radiology') {
            item = prescription.radiology[itemIndex];
            providerRole = 'radiologist';
        }

        if (!item) {
            res.status(404).json({ message: 'Item not found' });
            return;
        }

        // Only allow reassignment if item is partial, rejected, or partial_accepted
        const status = item.status as string || '';
        if (!['partial', 'rejected', 'partial_accepted'].includes(status)) {
            res.status(400).json({ message: 'Item cannot be reassigned unless it is partial, rejected, or partial_accepted' });
            return;
        }

        // Check new provider role
        const newProvider = await User.findById(newProviderId);
        if (!newProvider || newProvider.role !== providerRole) {
            res.status(400).json({ message: `Assigned provider must be a ${providerRole}` });
            return;
        }

        // Notify initial provider before reassignment
        const initialProviderId = item.assignedProvider;
        // Assign new provider, reset status, and add to history
        item.assignedProvider = newProvider._id;
        item.status = 'confirmed';
        if (!item.history) item.history = [];
        item.history.push({
            status: 'confirmed',
            date: new Date(),
            by: (req as any).user.id,
            note: 'Reassigned by patient' as any // allow note for now
        });

        await prescription.save();
        // Notify new provider
        await notify({
          userId: newProviderId,
          type: 'prescription_updated',
          title: 'Item Reassigned',
          message: 'A prescription item has been reassigned to you by the patient.',
          relatedEntity: { type: 'prescription', id: prescription._id }
        });
        // Notify initial provider (if exists and not same as new)
        if (initialProviderId && initialProviderId.toString() !== newProviderId) {
          await notify({
            userId: initialProviderId,
            type: 'prescription_updated',
            title: 'Item Reassigned by Patient',
            message: 'A prescription item you were assigned to has been reassigned by the patient.',
            relatedEntity: { type: 'prescription', id: prescription._id }
          });
        }
        res.json({ message: 'Item reassigned to new provider', prescription });
    } catch (err) {
        console.error('Reassign prescription item error:', err);
        res.status(500).json({ message: 'Failed to reassign item', error: err });
    }
};
// @desc    Fulfill (full/partial/reject) radiology exam items in a prescription
// @route   PATCH /api/prescriptions/:id/radiology/fulfillment
// @access  Private (Radiologist)
export const fulfillRadiologyItems = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { fulfillment } = req.body;
        if (!Array.isArray(fulfillment)) {
            res.status(400).json({ message: 'fulfillment must be an array' });
            return;
        }

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }

        let allFulfilled = true;
        let allRejected = true;
        for (const item of fulfillment) {
            const { radiologyIndex, fulfilled, reason } = item;
            if (typeof radiologyIndex !== 'number' || radiologyIndex < 0 || radiologyIndex >= prescription.radiology.length) {
                continue; // skip invalid index
            }
            const exam = prescription.radiology[radiologyIndex];
            if (fulfilled === true) {
                exam.status = 'fulfilled';
                allRejected = false;
            } else {
                exam.status = 'rejected';
                allFulfilled = false;
            }
            if (!exam.history) exam.history = [];
            exam.history.push({
                status: exam.status,
                date: new Date(),
                by: (req as any).user.id,
                ...(reason ? { note: reason } : {})
            });
        }

        // If some are fulfilled and some rejected, mark rejected as 'partial' for patient UI
        if (!allFulfilled && !allRejected) {
            for (const item of fulfillment) {
                const { radiologyIndex, fulfilled } = item;
                if (typeof radiologyIndex !== 'number' || radiologyIndex < 0 || radiologyIndex >= prescription.radiology.length) continue;
                const exam = prescription.radiology[radiologyIndex];
                if (exam.status === 'rejected') exam.status = 'partial';
            }
        }

        await prescription.save();
        // Notify patient for every status change
        await notify({
          userId: prescription.patientId,
          type: 'radiology_result_ready',
          title: 'Radiology Status Changed',
          message: 'Your radiology exam items have been updated by the radiologist.',
          relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Radiology fulfillment updated', prescription });
    } catch (err) {
        console.error('Radiology fulfillment error:', err);
        res.status(500).json({ message: 'Failed to update radiology fulfillment', error: err });
    }
};
// @desc    Fulfill (full/partial/reject) lab test items in a prescription
// @route   PATCH /api/prescriptions/:id/lab-tests/fulfillment
// @access  Private (Lab)
export const fulfillLabTestItems = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { fulfillment } = req.body;
        if (!Array.isArray(fulfillment)) {
            res.status(400).json({ message: 'fulfillment must be an array' });
            return;
        }

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }

        let allFulfilled = true;
        let allRejected = true;
        for (const item of fulfillment) {
            const { labTestIndex, fulfilled, reason } = item;
            if (typeof labTestIndex !== 'number' || labTestIndex < 0 || labTestIndex >= prescription.labTests.length) {
                continue; // skip invalid index
            }
            const lab = prescription.labTests[labTestIndex];
            if (fulfilled === true) {
                lab.status = 'fulfilled';
                allRejected = false;
            } else {
                lab.status = 'rejected';
                allFulfilled = false;
            }
            if (!lab.history) lab.history = [];
            lab.history.push({
                status: lab.status,
                date: new Date(),
                by: (req as any).user.id,
                ...(reason ? { note: reason } : {})
            });
        }

        // If some are fulfilled and some rejected, mark rejected as 'partial' for patient UI
        if (!allFulfilled && !allRejected) {
            for (const item of fulfillment) {
                const { labTestIndex, fulfilled } = item;
                if (typeof labTestIndex !== 'number' || labTestIndex < 0 || labTestIndex >= prescription.labTests.length) continue;
                const lab = prescription.labTests[labTestIndex];
                if (lab.status === 'rejected') lab.status = 'partial';
            }
        }

        await prescription.save();
        // Notify patient for every status change
        await notify({
          userId: prescription.patientId,
          type: 'lab_result_ready',
          title: 'Lab Test Status Changed',
          message: 'Your lab test items have been updated by the lab.',
          relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Lab test fulfillment updated', prescription });
    } catch (err) {
        console.error('Lab test fulfillment error:', err);
        res.status(500).json({ message: 'Failed to update lab test fulfillment', error: err });
    }
};
// @desc    Fulfill (full/partial/reject) medication items in a prescription
// @route   PATCH /api/prescriptions/:id/medications/fulfillment
// @access  Private (Pharmacy)
export const fulfillMedicationItems = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { fulfillment } = req.body;
        if (!Array.isArray(fulfillment)) {
            res.status(400).json({ message: 'fulfillment must be an array' });
            return;
        }

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }

        let allFulfilled = true;
        let allRejected = true;
        for (const item of fulfillment) {
            const { medicationIndex, fulfilled, reason } = item;
            if (typeof medicationIndex !== 'number' || medicationIndex < 0 || medicationIndex >= prescription.medications.length) {
                continue; // skip invalid index
            }
            const med = prescription.medications[medicationIndex];
            if (fulfilled === true) {
                med.status = 'fulfilled';
                allRejected = false;
            } else {
                med.status = 'rejected';
                allFulfilled = false;
            }
            if (!med.history) med.history = [];
            med.history.push({
                status: med.status,
                date: new Date(),
                by: (req as any).user.id,
                ...(reason ? { note: reason } : {})
            });
        }

        // If some are fulfilled and some rejected, mark rejected as 'partial' for patient UI
        if (!allFulfilled && !allRejected) {
            for (const item of fulfillment) {
                const { medicationIndex, fulfilled } = item;
                if (typeof medicationIndex !== 'number' || medicationIndex < 0 || medicationIndex >= prescription.medications.length) continue;
                const med = prescription.medications[medicationIndex];
                if (med.status === 'rejected') med.status = 'partial';
            }
        }

        await prescription.save();
        // Notify patient for every status change
        await notify({
          userId: prescription.patientId,
          type: 'prescription_updated',
          title: 'Medication Status Changed',
          message: 'Your medication items have been updated by the pharmacy.',
          relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Medication fulfillment updated', prescription });
    } catch (err) {
        console.error('Medication fulfillment error:', err);
        res.status(500).json({ message: 'Failed to update medication fulfillment', error: err });
    }
};
// Assign provider to a medication item
export const assignMedicationProvider = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { medicationIndex, providerId } = req.body;
        if (typeof medicationIndex !== 'number' || !providerId) {
            res.status(400).json({ message: 'medicationIndex (number) and providerId are required' });
            return;
        }

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }
        if (!prescription.medications || !prescription.medications[medicationIndex]) {
            res.status(404).json({ message: 'Medication item not found' });
            return;
        }

        // Check provider role
        const provider = await User.findById(providerId);
        if (!provider || provider.role !== 'pharmacy') {
            res.status(400).json({ message: 'Assigned provider must be a pharmacy' });
            return;
        }

        // Assign provider and update status/history
        prescription.medications[medicationIndex].assignedProvider = provider._id;
        prescription.medications[medicationIndex].status = 'confirmed';
        if (!prescription.medications[medicationIndex].history) {
            prescription.medications[medicationIndex].history = [];
        }
        prescription.medications[medicationIndex].history.push({
            status: 'confirmed',
            date: new Date(),
            by: (req as any).user.id
        });

        await prescription.save();
        // Notify provider
        await notify({
          userId: providerId,
          type: 'prescription_updated',
          title: 'Medication Assignment',
          message: 'A medication item has been assigned to you.',
          relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Provider assigned to medication', prescription });
    } catch (err) {
        console.error('Assign medication provider error:', err);
        res.status(500).json({ message: 'Failed to assign provider', error: err });
    }
};

// Assign provider to a lab test item
export const assignLabProvider = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { labTestIndex, providerId } = req.body;
        if (typeof labTestIndex !== 'number' || !providerId) {
            res.status(400).json({ message: 'labTestIndex (number) and providerId are required' });
            return;
        }

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }
        if (!prescription.labTests || !prescription.labTests[labTestIndex]) {
            res.status(404).json({ message: 'Lab test item not found' });
            return;
        }

        // Check provider role
        const provider = await User.findById(providerId);
        if (!provider || provider.role !== 'lab') {
            res.status(400).json({ message: 'Assigned provider must be a lab' });
            return;
        }

        // Assign provider and update status/history
        prescription.labTests[labTestIndex].assignedProvider = provider._id;
        prescription.labTests[labTestIndex].status = 'confirmed';
        if (!prescription.labTests[labTestIndex].history) {
            prescription.labTests[labTestIndex].history = [];
        }
        prescription.labTests[labTestIndex].history.push({
            status: 'confirmed',
            date: new Date(),
            by: (req as any).user.id
        });

        await prescription.save();
        // Notify provider
        await notify({
          userId: providerId,
          type: 'prescription_updated',
          title: 'Lab Test Assignment',
          message: 'A lab test item has been assigned to you.',
          relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Provider assigned to lab test', prescription });
    } catch (err) {
        console.error('Assign lab provider error:', err);
        res.status(500).json({ message: 'Failed to assign provider', error: err });
    }
};

// Assign provider to a radiology exam item
export const assignRadiologyProvider = async (req: Request, res: Response) => {
    try {
        const prescriptionId = req.params.id;
        const { radiologyIndex, providerId } = req.body;
        if (typeof radiologyIndex !== 'number' || !providerId) {
            res.status(400).json({ message: 'radiologyIndex (number) and providerId are required' });
            return;
        }

        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            res.status(404).json({ message: 'Prescription not found' });
            return;
        }
        if (!prescription.radiology || !prescription.radiology[radiologyIndex]) {
            res.status(404).json({ message: 'Radiology exam item not found' });
            return;
        }

        // Check provider role
        const provider = await User.findById(providerId);
        if (!provider || provider.role !== 'radiologist') {
            res.status(400).json({ message: 'Assigned provider must be a radiologist' });
            return;
        }

        // Assign provider and update status/history
        prescription.radiology[radiologyIndex].assignedProvider = provider._id;
        prescription.radiology[radiologyIndex].status = 'confirmed';
        if (!prescription.radiology[radiologyIndex].history) {
            prescription.radiology[radiologyIndex].history = [];
        }
        prescription.radiology[radiologyIndex].history.push({
            status: 'confirmed',
            date: new Date(),
            by: (req as any).user.id
        });

        await prescription.save();
        // Notify provider
        await notify({
          userId: providerId,
          type: 'prescription_updated',
          title: 'Radiology Assignment',
          message: 'A radiology exam item has been assigned to you.',
          relatedEntity: { type: 'prescription', id: prescription._id }
        });
        res.json({ message: 'Provider assigned to radiology exam', prescription });
    } catch (err) {
        console.error('Assign radiology provider error:', err);
        res.status(500).json({ message: 'Failed to assign provider', error: err });
    }
};

// @desc    Get prescriptions for a user (patient or provider)
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        let query: any = {};
        
        if (userRole === 'patient') {
            query.patientId = userId;
        } else {
            // Providers can see prescriptions they created
            query.providerId = userId;
        }

        const prescriptions = await Prescription.find(query)
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization')
            .sort({ createdAt: -1 });

        // Role-based filtering
        const filtered = prescriptions.map((prescription: any) => {
            if (userRole === 'pharmacy') {
                return {
                    ...prescription.toObject(),
                    labTests: [],
                    radiology: []
                };
            } else if (userRole === 'lab') {
                return {
                    ...prescription.toObject(),
                    medications: [],
                    radiology: []
                };
            } else if (userRole === 'radiologist') {
                return {
                    ...prescription.toObject(),
                    medications: [],
                    labTests: []
                };
            }
            // Doctor and patient see all, but return as plain object
            return prescription.toObject();
        });

        res.json(filtered);
    } catch (err) {
        console.error('Get prescriptions error:', err);
        res.status(500).json({ message: "Failed to fetch prescriptions", error: err });
    }
};

// @desc    Get a single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
export const getPrescriptionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('patientId', 'firstName lastName cnamId dateOfBirth')
            .populate('providerId', 'firstName lastName specialization licenseNumber');

        if (!prescription) {
            res.status(404).json({ message: "Prescription not found" });
            return;
        }
        
        // Optional: Add access control to ensure only related parties can view it
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const patientId = (prescription.patientId as any)._id?.toString() || prescription.patientId.toString();
        const providerId = (prescription.providerId as any)._id?.toString() || prescription.providerId.toString();
        
        if (patientId !== userId && providerId !== userId) {
             res.status(403).json({ message: "Not authorized to view this prescription" });
             return;
        }

        // Role-based filtering
        let filtered: any = prescription;
        if (userRole === 'pharmacy') {
            filtered = {
                ...prescription.toObject(),
                labTests: [],
                radiology: []
            };
        } else if (userRole === 'lab') {
            filtered = {
                ...prescription.toObject(),
                medications: [],
                radiology: []
            };
        } else if (userRole === 'radiologist') {
            filtered = {
                ...prescription.toObject(),
                medications: [],
                labTests: []
            };
        } else {
            filtered = prescription.toObject();
        }

        res.json(filtered);
    } catch (err) {
        console.error('Get prescription by ID error:', err);
        res.status(500).json({ message: "Failed to fetch prescription", error: err });
    }
};

// @desc    Generate and download a prescription PDF
// @route   GET /api/prescriptions/:id/pdf
// @access  Private
export const generatePrescriptionPdf = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('PDF download requested for prescription:', req.params.id);
        const prescription = await Prescription.findById(req.params.id)
            .populate('patientId', 'firstName lastName cnamId dateOfBirth')
            .populate('providerId', 'firstName lastName specialization licenseNumber');

        if (!prescription) {
            console.error('Prescription not found:', req.params.id);
            res.status(404).json({ message: "Prescription not found" });
            return;
        }

        // Optional: Add access control to ensure only related parties can view it
        const userId = (req as any).user.id;
        const patientId = (prescription.patientId as any)._id?.toString() || prescription.patientId.toString();
        const providerId = (prescription.providerId as any)._id?.toString() || prescription.providerId.toString();
        if (patientId !== userId && providerId !== userId) {
            console.error('Not authorized to view prescription:', req.params.id, 'User:', userId);
            res.status(403).json({ message: "Not authorized to view this prescription" });
            return;
        }

        // Generate PDF
        const doc = new PDFDocument();
        const filename = `prescription-${prescription._id}.pdf`;
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');

        // Pipe PDF to response
        const passthrough = new stream.PassThrough();
        doc.pipe(passthrough);
        passthrough.pipe(res);

        // PDF Content (full prescription)
        try {
            doc.fontSize(18).text('SehatyNet Prescription', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Date: ${new Date((prescription as any).createdAt).toLocaleDateString()}`);
            doc.text(`Doctor: Dr. ${(prescription.providerId as any).firstName} ${(prescription.providerId as any).lastName}`);
            doc.text(`Patient: ${(prescription.patientId as any).firstName} ${(prescription.patientId as any).lastName}`);
            doc.moveDown();
            // Medications Section
            if ((prescription.medications as any[]).length > 0) {
              doc.fontSize(14).text('Medications:', { underline: true });
              doc.moveDown(0.5);
              (prescription.medications as any[]).forEach((med, idx) => {
                  doc.fontSize(12).text(`${idx + 1}. ${med.name} - ${med.dosage}, ${med.frequency}, ${med.duration}`);
                  if (med.instructions) {
                      doc.fontSize(10).text(`   Instructions: ${med.instructions}`);
                  }
                  doc.moveDown(0.2);
              });
              doc.moveDown();
            }
            // Lab Tests Section
            if ((prescription.labTests as any[] && prescription.labTests.length > 0)) {
              doc.fontSize(14).text('Lab Tests:', { underline: true });
              doc.moveDown(0.5);
              (prescription.labTests as any[]).forEach((test, idx) => {
                  doc.fontSize(12).text(`${idx + 1}. ${test.testName}`);
                  if (test.notes) {
                      doc.fontSize(10).text(`   Notes: ${test.notes}`);
                  }
                  doc.moveDown(0.2);
              });
              doc.moveDown();
            }
            // Radiology Section
            if ((prescription.radiology as any[] && prescription.radiology.length > 0)) {
              doc.fontSize(14).text('Radiology:', { underline: true });
              doc.moveDown(0.5);
              (prescription.radiology as any[]).forEach((exam, idx) => {
                  doc.fontSize(12).text(`${idx + 1}. ${exam.examName}`);
                  if (exam.notes) {
                      doc.fontSize(10).text(`   Notes: ${exam.notes}`);
                  }
                  doc.moveDown(0.2);
              });
              doc.moveDown();
            }
            // Notes Section
            if (prescription.notes) {
                doc.moveDown();
                doc.fontSize(12).text('Notes:', { underline: true });
                doc.fontSize(10).text(prescription.notes);
            }
            doc.end();
            console.log('Full PDF generation completed for prescription:', req.params.id);
        } catch (pdfErr) {
            console.error('Error during full PDF generation:', pdfErr);
            res.status(500).json({ message: "Error generating full PDF content", error: pdfErr });
        }
    } catch (err) {
        console.error('Generate prescription PDF error:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate prescription PDF", error: err });
        }
    }
}; 