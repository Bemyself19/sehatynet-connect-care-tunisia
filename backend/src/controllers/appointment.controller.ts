import { Request, Response } from "express";
import Appointment from "../models/appointment.model";
import User from "../models/user.model";

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
    const { 
        providerId, 
        scheduledDate, 
        scheduledTime, 
        type, 
        duration, 
        symptoms, 
        notes, 
        appointmentType, 
        reason 
    } = req.body;
    
    try {
        const patientId = (req as any).user.id;
        
        // Debug log for appointment creation
        console.log('[CREATE_APPOINTMENT] patientId:', patientId, 'providerId:', providerId);
        
        // Check if patient and provider are the same user
        if (patientId === providerId) {
            res.status(400).json({ message: "Provider and patient cannot be the same user" });
            return;
        }

        // Check if provider exists and is active
        const provider = await User.findById(providerId);
        if (!provider || !provider.isActive) {
            res.status(404).json({ message: "Provider not found or inactive" });
            return;
        }

        // Check for time conflicts
        const existingAppointment = await Appointment.findOne({
            providerId,
            scheduledDate,
            scheduledTime,
            status: { $nin: ['cancelled', 'no-show'] }
        });

        if (existingAppointment) {
            res.status(400).json({ message: "Time slot is already booked" });
            return;
        }

        const appointment = new Appointment({
            patientId,
            providerId,
            type: type || 'consultation',
            scheduledDate,
            scheduledTime,
            duration: duration || 30,
            consultationFee: provider.consultationFee,
            symptoms,
            notes,
            appointmentType: appointmentType || 'in-person',
            reason
        });

        await appointment.save();

        // Debug log for saved appointment
        console.log('[CREATE_APPOINTMENT] Saved appointment:', appointment);

        // Populate provider details for response
        await appointment.populate('providerId', 'firstName lastName specialization');

        res.status(201).json({
            message: "Appointment created successfully",
            appointment
        });
    } catch (err) {
        console.error('Create appointment error:', err);
        res.status(500).json({ message: "Failed to create appointment", error: err });
    }
};

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        
        let query: any = {};
        
        if (userRole === 'patient') {
            query.patientId = userId;
        } else if (['doctor', 'pharmacy', 'lab', 'radiologist'].includes(userRole)) {
            query.providerId = userId;
        }

        const appointments = await Appointment.find(query)
            .populate('patientId', 'firstName lastName email phone role')
            .populate('providerId', 'firstName lastName specialization role')
            .sort({ scheduledDate: 1, scheduledTime: 1 });

        res.json(appointments);
    } catch (err) {
        console.error('Get appointments error:', err);
        res.status(500).json({ message: "Failed to fetch appointments", error: err });
    }
};

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        
        const appointment = await Appointment.findById(id)
            .populate('patientId', 'firstName lastName email phone role')
            .populate('providerId', 'firstName lastName specialization role');

        if (!appointment) {
            res.status(404).json({ message: "Appointment not found" });
            return;
        }

        // Check if user has access to this appointment
        if (appointment.patientId._id.toString() !== userId && 
            appointment.providerId._id.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        res.json(appointment);
    } catch (err) {
        console.error('Get appointment error:', err);
        res.status(500).json({ message: "Failed to fetch appointment", error: err });
    }
};

export const updateAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = (req as any).user.id;
        
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            res.status(404).json({ message: "Appointment not found" });
            return;
        }

        // Check if user has permission to update this appointment
        if (appointment.patientId.toString() !== userId && 
            appointment.providerId.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // Only allow certain fields to be updated
        const allowedUpdates = ['status', 'notes', 'diagnosis', 'prescription', 'scheduledDate', 'scheduledTime'];
        const filteredUpdates: any = {};
        
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });

        const updatedAppointment = await Appointment.findByIdAndUpdate(
            id, 
            filteredUpdates, 
            { new: true }
        ).populate('patientId', 'firstName lastName email phone role')
         .populate('providerId', 'firstName lastName specialization role');

        res.json({
            message: "Appointment updated successfully",
            appointment: updatedAppointment
        });
    } catch (err) {
        console.error('Update appointment error:', err);
        res.status(500).json({ message: "Failed to update appointment", error: err });
    }
};

export const cancelAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        
        const appointment = await Appointment.findById(id);
        
        if (!appointment) {
            res.status(404).json({ message: "Appointment not found" });
            return;
        }

        // Check if user has permission to cancel this appointment
        if (appointment.patientId.toString() !== userId && 
            appointment.providerId.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.json({
            message: "Appointment cancelled successfully",
            appointment
        });
    } catch (err) {
        console.error('Cancel appointment error:', err);
        res.status(500).json({ message: "Failed to cancel appointment", error: err });
    }
};

export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
    try {
        const { providerId, date } = req.query;
        
        if (!providerId || !date) {
            res.status(400).json({ message: "Provider ID and date are required" });
            return;
        }

        // Get provider's working hours
        const provider = await User.findById(providerId);
        if (!provider) {
            res.status(404).json({ message: "Provider not found" });
            return;
        }

        // Get booked slots for the date
        const bookedSlots = await Appointment.find({
            providerId,
            scheduledDate: date,
            status: { $nin: ['cancelled', 'no-show'] }
        }).select('scheduledTime');

        const bookedTimes = bookedSlots.map(slot => slot.scheduledTime);

        // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
        const timeSlots = [];
        const startHour = 9;
        const endHour = 17;
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                if (!bookedTimes.includes(time)) {
                    timeSlots.push(time);
                }
            }
        }

        res.json({
            provider: {
                id: provider._id,
                name: `${provider.firstName} ${provider.lastName}`,
                specialization: provider.specialization
            },
            date,
            availableSlots: timeSlots
        });
    } catch (err) {
        console.error('Get available slots error:', err);
        res.status(500).json({ message: "Failed to get available slots", error: err });
    }
}; 