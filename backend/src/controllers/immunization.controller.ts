import { Request, Response } from "express";
import Immunization from "../models/immunization.model";
import User from "../models/user.model";

export const createImmunization = async (req: Request, res: Response): Promise<void> => {
    const { 
        patientId, 
        vaccineName,
        vaccineType,
        category,
        doses,
        totalDosesRequired,
        nextDueDate,
        contraindications,
        adverseReactions,
        notes,
        isRequired,
        source
    } = req.body;
    
    try {
        const providerId = (req as any).user.id;
        
        // Check if patient exists
        const patient = await User.findById(patientId);
        if (!patient) {
            res.status(404).json({ message: "Patient not found" });
            return;
        }

        // Validate doses array
        if (!doses || doses.length === 0) {
            res.status(400).json({ message: "At least one dose is required" });
            return;
        }

        // Calculate status based on doses
        let status = 'incomplete';
        if (doses.length >= totalDosesRequired) {
            status = 'up_to_date';
        } else if (nextDueDate && new Date(nextDueDate) < new Date()) {
            status = 'overdue';
        }

        const immunization = new Immunization({
            patientId,
            vaccineName,
            vaccineType,
            category,
            doses,
            totalDosesRequired: totalDosesRequired || 1,
            status,
            nextDueDate,
            contraindications: contraindications || [],
            adverseReactions: adverseReactions || [],
            notes,
            isRequired: isRequired !== false,
            source: source || 'healthcare_provider'
        });

        await immunization.save();

        // Populate references
        await immunization.populate('patientId', 'firstName lastName cnamId');
        await immunization.populate('doses.administeredBy', 'firstName lastName');

        res.status(201).json({
            message: "Immunization created successfully",
            immunization
        });
    } catch (err) {
        console.error('Create immunization error:', err);
        res.status(500).json({ message: "Failed to create immunization", error: err });
    }
};

export const getImmunizations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { patientId, status, vaccineType, category } = req.query;
        
        let query: any = {};
        
        if (userRole === 'patient') {
            query.patientId = userId;
        } else if (['doctor', 'lab'].includes(userRole)) {
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
                    
                    // Check patient consent for accessing immunization records from other providers
                    const User = require('../models/user.model').default;
                    const patient = await User.findById(patientId).select('allowOtherDoctorsAccess');
                    
                    if (!patient) {
                        res.status(404).json({ message: "Patient not found" });
                        return;
                    }
                    
                    // If patient hasn't given consent, only show immunizations this doctor recorded
                    if (!patient.allowOtherDoctorsAccess) {
                        query = {
                            patientId: patientId,
                            providerId: userId
                        };
                    } else {
                        // Patient has given consent, show all immunizations for this patient
                        query.patientId = patientId;
                    }
                } else {
                    // For lab and other providers
                    query.patientId = patientId;
                }
            } else {
                // Providers can see all immunizations for patients they care for
                query.status = { $ne: 'not_applicable' };
            }
        } else {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by vaccine type
        if (vaccineType) {
            query.vaccineType = vaccineType;
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        const immunizations = await Immunization.find(query)
            .populate('patientId', 'firstName lastName cnamId')
            .populate('doses.administeredBy', 'firstName lastName')
            .sort({ nextDueDate: 1, createdAt: -1 });

        res.json(immunizations);
    } catch (err) {
        console.error('Get immunizations error:', err);
        res.status(500).json({ message: "Failed to fetch immunizations", error: err });
    }
};

export const getImmunizationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const immunization = await Immunization.findById(id)
            .populate('patientId', 'firstName lastName cnamId email phone')
            .populate('doses.administeredBy', 'firstName lastName');

        if (!immunization) {
            res.status(404).json({ message: "Immunization not found" });
            return;
        }

        // Check access permissions
        if (userRole === 'patient') {
            if (immunization.patientId.toString() !== userId) {
                res.status(403).json({ message: "Access denied" });
                return;
            }
        }

        res.json(immunization);
    } catch (err) {
        console.error('Get immunization by ID error:', err);
        res.status(500).json({ message: "Failed to fetch immunization", error: err });
    }
};

export const updateImmunization = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        const immunization = await Immunization.findById(id);
        if (!immunization) {
            res.status(404).json({ message: "Immunization not found" });
            return;
        }

        // Check permissions
        if (userRole === 'patient') {
            res.status(403).json({ message: "Patients cannot update immunizations" });
            return;
        }

        const updatedImmunization = await Immunization.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        ).populate('patientId', 'firstName lastName cnamId')
         .populate('doses.administeredBy', 'firstName lastName');

        res.json({
            message: "Immunization updated successfully",
            immunization: updatedImmunization
        });
    } catch (err) {
        console.error('Update immunization error:', err);
        res.status(500).json({ message: "Failed to update immunization", error: err });
    }
};

export const addDose = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { doseNumber, date, lotNumber, manufacturer, site, route, notes } = req.body;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        if (!['doctor', 'lab'].includes(userRole)) {
            res.status(403).json({ message: "Only doctors and lab technicians can add doses" });
            return;
        }

        const immunization = await Immunization.findById(id);
        if (!immunization) {
            res.status(404).json({ message: "Immunization not found" });
            return;
        }

        const newDose = {
            doseNumber,
            date: new Date(date),
            lotNumber,
            manufacturer,
            administeredBy: userId,
            site,
            route,
            notes
        };

        immunization.doses.push(newDose);

        // Update status based on total doses
        if (immunization.doses.length >= immunization.totalDosesRequired) {
            immunization.status = 'up_to_date';
            immunization.nextDueDate = undefined;
        } else {
            immunization.status = 'incomplete';
        }

        await immunization.save();

        await immunization.populate('patientId', 'firstName lastName cnamId');
        await immunization.populate('doses.administeredBy', 'firstName lastName');

        res.json({
            message: "Dose added successfully",
            immunization
        });
    } catch (err) {
        console.error('Add dose error:', err);
        res.status(500).json({ message: "Failed to add dose", error: err });
    }
};

export const getOverdueImmunizations = async (req: Request, res: Response): Promise<void> => {
    try {
        const userRole = (req as any).user.role;
        
        if (!['doctor', 'lab', 'admin'].includes(userRole)) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const overdueImmunizations = await Immunization.find({
            status: 'overdue',
            isRequired: true
        })
        .populate('patientId', 'firstName lastName cnamId phone')
        .populate('doses.administeredBy', 'firstName lastName')
        .sort({ nextDueDate: 1 });

        res.json(overdueImmunizations);
    } catch (err) {
        console.error('Get overdue immunizations error:', err);
        res.status(500).json({ message: "Failed to fetch overdue immunizations", error: err });
    }
};

export const getImmunizationSchedule = async (req: Request, res: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        // Check permissions
        if (userRole === 'patient' && patientId !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        const immunizations = await Immunization.find({ 
            patientId,
            isRequired: true 
        })
        .populate('doses.administeredBy', 'firstName lastName')
        .sort({ nextDueDate: 1 });

        // Group by status
        const schedule = {
            upToDate: immunizations.filter(imm => imm.status === 'up_to_date'),
            overdue: immunizations.filter(imm => imm.status === 'overdue'),
            incomplete: immunizations.filter(imm => imm.status === 'incomplete'),
            upcoming: immunizations.filter(imm => 
                imm.nextDueDate && 
                new Date(imm.nextDueDate) > new Date() &&
                imm.status === 'incomplete'
            )
        };

        res.json(schedule);
    } catch (err) {
        console.error('Get immunization schedule error:', err);
        res.status(500).json({ message: "Failed to fetch immunization schedule", error: err });
    }
}; 