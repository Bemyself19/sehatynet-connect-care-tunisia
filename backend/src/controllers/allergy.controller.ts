import { Request, Response } from "express";
import Allergy from "../models/allergy.model";
import User from "../models/user.model";

export const createAllergy = async (req: Request, res: Response): Promise<void> => {
    const { 
        patientId, 
        allergenName,
        allergenType,
        category,
        reactions,
        firstOccurrence,
        lastOccurrence,
        status,
        notes,
        isHighRisk,
        emergencyInstructions,
        avoidanceInstructions
    } = req.body;
    
    try {
        const providerId = (req as any).user.id;
        
        // Check if patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: "Patient not found" });
            return;
        }

        // Check if allergy already exists for this patient
        const existingAllergy = await Allergy.findOne({
            patientId,
            allergenName,
            status: 'active'
        });

        if (existingAllergy) {
            res.status(400).json({ message: "This allergy is already recorded for this patient" });
            return;
        }

        const allergy = new Allergy({
            patientId,
            allergenName,
            allergenType,
            category,
            reactions: reactions || [],
            firstOccurrence,
            lastOccurrence,
            status: status || 'active',
            notes,
            isHighRisk: isHighRisk || false,
            emergencyInstructions,
            avoidanceInstructions
        });

        await allergy.save();

        // Populate references
        await allergy.populate('patientId', 'firstName lastName cnamId');
        await allergy.populate('confirmedBy', 'firstName lastName');

        res.status(201).json({
            message: "Allergy created successfully",
            allergy
        });
    } catch (err) {
        console.error('Create allergy error:', err);
        res.status(500).json({ message: "Failed to create allergy", error: err });
    }
};

export const getAllergies = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { patientId, status, allergenType, isHighRisk } = req.query;
        
        let query: any = {};
        
        if (userRole === 'patient') {
            query.patientId = userId;
        } else if (['doctor', 'pharmacy', 'lab'].includes(userRole)) {
            if (patientId) {
                // For doctors: verify they have consulted with this patient
                if (userRole === 'doctor') {
                    const Appointment = require('../models/appointment.model').default;
                    
                    const hasConsultedPatient = await Appointment.exists({ 
                        providerId: userId, 
                        patientId: patientId 
                    });
                    
                    if (!hasConsultedPatient) {
                        res.status(403).json({ message: "Access denied: No consultation history with this patient" });
                        return;
                    }
                    
                    // Check patient consent for accessing allergy information from other providers
                    const User = require('../models/user.model').default;
                    const patient = await User.findById(patientId).select('allowOtherDoctorsAccess');
                    
                    if (!patient) {
                        res.status(404).json({ message: "Patient not found" });
                        return;
                    }
                    
                    // If patient hasn't given consent, only show allergies this doctor recorded
                    if (!patient.allowOtherDoctorsAccess) {
                        query = {
                            patientId: patientId,
                            providerId: userId
                        };
                    } else {
                        // Patient has given consent, show all allergies for this patient
                        query.patientId = patientId;
                    }
                } else {
                    // For pharmacy, lab and other providers
                    query.patientId = patientId;
                }
            } else {
                // Providers can see all allergies for patients they care for
                // This would need to be enhanced based on your patient-provider relationship model
                query.status = 'active';
            }
        } else {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by allergen type
        if (allergenType) {
            query.allergenType = allergenType;
        }

        // Filter by high risk
        if (isHighRisk !== undefined) {
            query.isHighRisk = isHighRisk === 'true';
        }

        const allergies = await Allergy.find(query)
            .populate('patientId', 'firstName lastName cnamId')
            .populate('confirmedBy', 'firstName lastName')
            .sort({ isHighRisk: -1, createdAt: -1 });

        res.json(allergies);
    } catch (err) {
        console.error('Get allergies error:', err);
        res.status(500).json({ message: "Failed to fetch allergies", error: err });
    }
};

export const getAllergyById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const allergy = await Allergy.findById(id)
            .populate('patientId', 'firstName lastName cnamId email phone')
            .populate('confirmedBy', 'firstName lastName');

        if (!allergy) {
            res.status(404).json({ message: "Allergy not found" });
            return;
        }

        // Check access permissions
        if (userRole === 'patient') {
            if (allergy.patientId.toString() !== userId) {
                res.status(403).json({ message: "Access denied" });
                return;
            }
        }

        res.json(allergy);
    } catch (err) {
        console.error('Get allergy by ID error:', err);
        res.status(500).json({ message: "Failed to fetch allergy", error: err });
    }
};

export const updateAllergy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const allergy = await Allergy.findById(id);
        if (!allergy) {
            res.status(404).json({ message: "Allergy not found" });
            return;
        }

        // Check permissions
        if (userRole === 'patient') {
            res.status(403).json({ message: "Patients cannot update allergies" });
            return;
        }

        const updatedAllergy = await Allergy.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('confirmedBy', 'firstName lastName');

        res.json({
            message: "Allergy updated successfully",
            allergy: updatedAllergy
        });
    } catch (err) {
        console.error('Update allergy error:', err);
        res.status(500).json({ message: "Failed to update allergy", error: err });
    }
};

export const confirmAllergy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        if (!['doctor', 'lab'].includes(userRole)) {
            res.status(403).json({ message: "Only doctors and lab technicians can confirm allergies" });
            return;
        }

        const allergy = await Allergy.findByIdAndUpdate(
            id,
            {
                confirmedBy: userId,
                confirmedAt: new Date()
            },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('confirmedBy', 'firstName lastName');

        if (!allergy) {
            res.status(404).json({ message: "Allergy not found" });
            return;
        }

        res.json({
            message: "Allergy confirmed successfully",
            allergy
        });
    } catch (err) {
        console.error('Confirm allergy error:', err);
        res.status(500).json({ message: "Failed to confirm allergy", error: err });
    }
};

export const resolveAllergy = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        if (!['doctor'].includes(userRole)) {
            res.status(403).json({ message: "Only doctors can resolve allergies" });
            return;
        }

        // First get the current allergy to access its notes
        const currentAllergy = await Allergy.findById(id);
        if (!currentAllergy) {
            res.status(404).json({ message: "Allergy not found" });
            return;
        }

        const allergy = await Allergy.findByIdAndUpdate(
            id,
            {
                status: 'resolved',
                notes: notes ? `${currentAllergy.notes || ''}\nResolved: ${notes}` : currentAllergy.notes
            },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('confirmedBy', 'firstName lastName');

        if (!allergy) {
            res.status(404).json({ message: "Allergy not found" });
            return;
        }

        res.json({
            message: "Allergy resolved successfully",
            allergy
        });
    } catch (err) {
        console.error('Resolve allergy error:', err);
        res.status(500).json({ message: "Failed to resolve allergy", error: err });
    }
};

export const getHighRiskAllergies = async (req: Request, res: Response): Promise<void> => {
    try {
        const userRole = (req as any).user.role;
        
        if (!['doctor', 'pharmacy', 'lab', 'admin'].includes(userRole)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const highRiskAllergies = await Allergy.find({
            isHighRisk: true,
            status: 'active'
        })
        .populate('patientId', 'firstName lastName cnamId phone')
        .populate('confirmedBy', 'firstName lastName')
        .sort({ createdAt: -1 });

        res.json(highRiskAllergies);
    } catch (err) {
        console.error('Get high risk allergies error:', err);
        res.status(500).json({ message: "Failed to fetch high risk allergies", error: err });
    }
};

export const checkMedicationAllergies = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId, medicationName } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Check permissions
        if (userRole === 'patient' && patientId !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const allergies = await Allergy.find({
            patientId,
            allergenType: 'medication',
            status: 'active'
        });

        const medicationAllergies = allergies.filter(allergy => 
            allergy.allergenName.toLowerCase().includes(medicationName.toLowerCase()) ||
            allergy.category?.toLowerCase().includes(medicationName.toLowerCase())
        );

        res.json({
            hasAllergies: medicationAllergies.length > 0,
            allergies: medicationAllergies
        });
    } catch (err) {
        console.error('Check medication allergies error:', err);
        res.status(500).json({ message: "Failed to check medication allergies", error: err });
    }
}; 