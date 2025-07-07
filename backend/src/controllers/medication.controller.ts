import { Request, Response } from "express";
import MedicationHistory from "../models/medication.model";
import User from "../models/user.model";

export const createMedicationHistory = async (req: Request, res: Response): Promise<void> => {
    const { 
        patientId, 
        medicalRecordId,
        medicationName,
        genericName,
        medicationType,
        dosage,
        startDate,
        endDate,
        status,
        reason,
        sideEffects,
        effectiveness,
        notes
    } = req.body;
    
    try {
        const providerId = (req as any).user.id;
        
        // Check if patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: "Patient not found" });
            return;
        }

        // If this is a new active medication, set previous medications of same type to inactive
        if (status === 'active') {
            await MedicationHistory.updateMany(
                { 
                    patientId, 
                    medicationName, 
                    status: 'active' 
                },
                { 
                    status: 'discontinued',
                    endDate: new Date()
                }
            );
        }

        const medicationHistory = new MedicationHistory({
            patientId,
            providerId,
            medicalRecordId,
            medicationName,
            genericName,
            medicationType,
            dosage,
            startDate,
            endDate,
            status: status || 'active',
            reason,
            sideEffects: sideEffects || [],
            effectiveness: effectiveness || 'unknown',
            notes,
            isCurrent: status === 'active'
        });

        await medicationHistory.save();

        // Populate references
        await medicationHistory.populate('patientId', 'firstName lastName cnamId');
        await medicationHistory.populate('providerId', 'firstName lastName specialization');

        res.status(201).json({
            message: "Medication history created successfully",
            medicationHistory
        });
    } catch (err) {
        console.error('Create medication history error:', err);
        res.status(500).json({ message: "Failed to create medication history", error: err });
    }
};

export const getMedicationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { patientId, status, isCurrent } = req.query;
        
        let query: any = {};
        
        if (userRole === 'patient') {
            query.patientId = userId;
        } else if (['doctor', 'pharmacy'].includes(userRole)) {
            if (patientId) {
                query.patientId = patientId;
            } else {
                // Providers can see all medications they prescribed
                query.providerId = userId;
            }
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by current medications
        if (isCurrent !== undefined) {
            query.isCurrent = isCurrent === 'true';
        }

        const medicationHistory = await MedicationHistory.find(query)
            .populate('patientId', 'firstName lastName cnamId')
            .populate('providerId', 'firstName lastName specialization')
            .sort({ startDate: -1, createdAt: -1 });

        res.json(medicationHistory);
    } catch (err) {
        console.error('Get medication history error:', err);
        res.status(500).json({ message: "Failed to fetch medication history", error: err });
    }
};

export const getMedicationHistoryById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const medicationHistory = await MedicationHistory.findById(id)
            .populate('patientId', 'firstName lastName cnamId email phone')
            .populate('providerId', 'firstName lastName specialization');

        if (!medicationHistory) {
            res.status(404).json({ message: "Medication history not found" });
            return;
        }

        // Check access permissions
        if (userRole === 'patient') {
            if (medicationHistory.patientId.toString() !== userId) {
                res.status(403).json({ message: "Access denied" });
                return;
            }
        }

        res.json(medicationHistory);
    } catch (err) {
        console.error('Get medication history by ID error:', err);
        res.status(500).json({ message: "Failed to fetch medication history", error: err });
    }
};

export const updateMedicationHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const medicationHistory = await MedicationHistory.findById(id);
        if (!medicationHistory) {
            res.status(404).json({ message: "Medication history not found" });
            return;
        }

        // Check permissions
        if (userRole === 'patient') {
            res.status(403).json({ message: "Patients cannot update medication history" });
            return;
        }

        if (userRole === 'pharmacy' && medicationHistory.providerId.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const updatedMedicationHistory = await MedicationHistory.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('providerId', 'firstName lastName specialization');

        res.json({
            message: "Medication history updated successfully",
            medicationHistory: updatedMedicationHistory
        });
    } catch (err) {
        console.error('Update medication history error:', err);
        res.status(500).json({ message: "Failed to update medication history", error: err });
    }
};

export const discontinueMedication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason, notes } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        if (!['doctor', 'pharmacy'].includes(userRole)) {
            res.status(403).json({ message: "Only doctors and pharmacists can discontinue medications" });
            return;
        }

        // First get the current medication to access its notes
        const currentMedication = await MedicationHistory.findById(id);
        if (!currentMedication) {
            res.status(404).json({ message: "Medication history not found" });
            return;
        }

        const medicationHistory = await MedicationHistory.findByIdAndUpdate(
            id,
            {
                status: 'discontinued',
                endDate: new Date(),
                isCurrent: false,
                notes: notes ? `${currentMedication.notes || ''}\nDiscontinued: ${notes}` : currentMedication.notes
            },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('providerId', 'firstName lastName specialization');

        if (!medicationHistory) {
            res.status(404).json({ message: "Medication history not found" });
            return;
        }

        res.json({
            message: "Medication discontinued successfully",
            medicationHistory
        });
    } catch (err) {
        console.error('Discontinue medication error:', err);
        res.status(500).json({ message: "Failed to discontinue medication", error: err });
    }
};

export const getCurrentMedications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Check permissions
        if (userRole === 'patient' && patientId !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const currentMedications = await MedicationHistory.find({ 
            patientId, 
            status: 'active',
            isCurrent: true 
        })
        .populate('providerId', 'firstName lastName specialization')
        .sort({ startDate: -1 });

        res.json(currentMedications);
    } catch (err) {
        console.error('Get current medications error:', err);
        res.status(500).json({ message: "Failed to fetch current medications", error: err });
    }
};

export const getMedicationInteractions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Check permissions
        if (userRole === 'patient' && patientId !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // Get current medications
        const currentMedications = await MedicationHistory.find({ 
            patientId, 
            status: 'active',
            isCurrent: true 
        });

        // This is a simplified interaction check
        // In a real implementation, you would integrate with a drug interaction API
        const interactions = [];
        const medicationNames = currentMedications.map(med => med.medicationName);

        // Example interaction logic (simplified)
        if (medicationNames.includes('Warfarin') && medicationNames.includes('Aspirin')) {
            interactions.push({
                severity: 'high',
                description: 'Increased risk of bleeding when combining Warfarin and Aspirin',
                medications: ['Warfarin', 'Aspirin']
            });
        }

        res.json({
            currentMedications,
            interactions
        });
    } catch (err) {
        console.error('Get medication interactions error:', err);
        res.status(500).json({ message: "Failed to fetch medication interactions", error: err });
    }
}; 