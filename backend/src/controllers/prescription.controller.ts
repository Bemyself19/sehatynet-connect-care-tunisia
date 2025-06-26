import { Request, Response } from "express";
import Prescription from "../models/prescription.model";
import User from "../models/user.model";
import Appointment from "../models/appointment.model";
import MedicalRecord from "../models/medicalRecord.model";
import PDFDocument from 'pdfkit';
import stream from 'stream';

// @desc    Create a new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor only)
export const createPrescription = async (req: Request, res: Response): Promise<void> => {
    const { 
        patientId, 
        appointmentId,
        medications = [],
        labTests = [],
        radiology = [],
        notes
    } = req.body;
    
    try {
        const providerId = (req as any).user.id;

        // Validation: at least one section must be non-empty
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
        
        // Create a medical record for this prescription event
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

        res.status(201).json({
            message: "Prescription created successfully",
            prescription: savedPrescription
        });
    } catch (err) {
        console.error('Create prescription error:', err);
        res.status(500).json({ message: "Failed to create prescription", error: err });
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