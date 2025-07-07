import { Request, Response } from "express";
import LabResult from "../models/labResult.model";
import MedicalRecord from "../models/medicalRecord.model";
import User from "../models/user.model";

export const createLabResult = async (req: Request, res: Response): Promise<void> => {
    const { 
        patientId, 
        medicalRecordId,
        labName,
        orderDate,
        collectionDate,
        resultDate,
        tests,
        overallStatus,
        clinicalNotes
    } = req.body;
    
    try {
        const providerId = (req as any).user.id;
        
        // Check if patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: "Patient not found" });
            return;
        }

        // Check if medical record exists
        const medicalRecord = await MedicalRecord.findById(medicalRecordId);
        if (!medicalRecord) {
            res.status(404).json({ message: "Medical record not found" });
            return;
        }

        // Validate tests array
        if (!tests || tests.length === 0) {
            res.status(400).json({ message: "At least one test result is required" });
            return;
        }

        const labResult = new LabResult({
            patientId,
            providerId,
            medicalRecordId,
            labName,
            orderDate,
            collectionDate,
            resultDate,
            tests,
            overallStatus: overallStatus || 'pending',
            clinicalNotes
        });

        await labResult.save();

        // Populate references
        await labResult.populate('patientId', 'firstName lastName cnamId');
        await labResult.populate('providerId', 'firstName lastName specialization');

        res.status(201).json({
            message: "Lab result created successfully",
            labResult
        });
    } catch (err) {
        console.error('Create lab result error:', err);
        res.status(500).json({ message: "Failed to create lab result", error: err });
    }
};

export const getLabResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { patientId } = req.query;
        
        let query: any = {};
        
        if (userRole === 'patient') {
            query.patientId = userId;
        } else if (['doctor', 'lab'].includes(userRole)) {
            if (patientId) {
                query.patientId = patientId;
            } else {
                // Providers can see all lab results they created or are assigned to
                query.$or = [
                    { providerId: userId },
                    { 'tests.status': 'critical' } // Critical results visible to all providers
                ];
            }
        }

        const labResults = await LabResult.find(query)
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization')
            .populate('verifiedBy', 'firstName lastName')
            .sort({ orderDate: -1, createdAt: -1 });

        res.json(labResults);
    } catch (err) {
        console.error('Get lab results error:', err);
        res.status(500).json({ message: "Failed to fetch lab results", error: err });
    }
};

export const getLabResultById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const labResult = await LabResult.findById(id)
            .populate('patientId', 'firstName lastName cnamId email phone')
            .populate('providerId', 'firstName lastName specialization')
            .populate('verifiedBy', 'firstName lastName');

        if (!labResult) {
            res.status(404).json({ message: "Lab result not found" });
            return;
        }

        // Check access permissions
        if (userRole === 'patient') {
            if (labResult.patientId.toString() !== userId) {
                res.status(403).json({ message: "Access denied" });
                return;
            }
        }

        res.json(labResult);
    } catch (err) {
        console.error('Get lab result by ID error:', err);
        res.status(500).json({ message: "Failed to fetch lab result", error: err });
    }
};

export const updateLabResult = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const labResult = await LabResult.findById(id);
        if (!labResult) {
            res.status(404).json({ message: "Lab result not found" });
            return;
        }

        // Check permissions
        if (userRole === 'patient') {
            res.status(403).json({ message: "Patients cannot update lab results" });
            return;
        }

        if (userRole === 'lab' && labResult.providerId.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const updatedLabResult = await LabResult.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('providerId', 'firstName lastName specialization');

        res.json({
            message: "Lab result updated successfully",
            labResult: updatedLabResult
        });
    } catch (err) {
        console.error('Update lab result error:', err);
        res.status(500).json({ message: "Failed to update lab result", error: err });
    }
};

export const verifyLabResult = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        if (!['doctor', 'lab'].includes(userRole)) {
            res.status(403).json({ message: "Only doctors and lab technicians can verify results" });
            return;
        }

        const labResult = await LabResult.findByIdAndUpdate(
            id,
            {
                isVerified: true,
                verifiedBy: userId,
                verifiedAt: new Date()
            },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('providerId', 'firstName lastName specialization')
         .populate('verifiedBy', 'firstName lastName');

        if (!labResult) {
            res.status(404).json({ message: "Lab result not found" });
            return;
        }

        res.json({
            message: "Lab result verified successfully",
            labResult
        });
    } catch (err) {
        console.error('Verify lab result error:', err);
        res.status(500).json({ message: "Failed to verify lab result", error: err });
    }
};

export const getLabResultsByPatient = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Check permissions
        if (userRole === 'patient' && patientId !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const labResults = await LabResult.find({ patientId })
            .populate('providerId', 'firstName lastName specialization')
            .populate('verifiedBy', 'firstName lastName')
            .sort({ orderDate: -1 });

        res.json(labResults);
    } catch (err) {
        console.error('Get lab results by patient error:', err);
        res.status(500).json({ message: "Failed to fetch lab results", error: err });
    }
};

export const getCriticalLabResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const userRole = (req as any).user.role;
        
        if (!['doctor', 'lab', 'admin'].includes(userRole)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const criticalResults = await LabResult.find({
            $or: [
                { overallStatus: 'critical' },
                { 'tests.status': 'critical' }
            ]
        })
        .populate('patientId', 'firstName lastName cnamId phone')
        .populate('providerId', 'firstName lastName specialization')
        .sort({ createdAt: -1 });

        res.json(criticalResults);
    } catch (err) {
        console.error('Get critical lab results error:', err);
        res.status(500).json({ message: "Failed to fetch critical lab results", error: err });
    }
}; 