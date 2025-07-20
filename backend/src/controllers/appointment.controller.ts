import { Request, Response } from "express";
import Appointment from "../models/appointment.model";
import User from "../models/user.model";
import Notification from "../models/notification.model";

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
            reason,
            status: 'pending' // New appointments start as pending doctor approval
        });

        await appointment.save();

        // Debug log for saved appointment
        console.log('[CREATE_APPOINTMENT] Saved appointment:', appointment);

        // Populate patient and provider details for notification
        await appointment.populate('patientId', 'firstName lastName');
        await appointment.populate('providerId', 'firstName lastName specialization');

        // Create notification for doctor to review new appointment
        await Notification.create({
            userId: providerId,
            type: 'appointment_pending',
            title: 'newAppointmentRequest',
            message: 'appointmentRequestMessage',
            translationData: {
                patientName: `${(appointment.patientId as any).firstName} ${(appointment.patientId as any).lastName}`,
                date: new Date(scheduledDate).toLocaleDateString()
            },
            priority: 'medium',
            relatedEntity: {
                type: 'appointment',
                id: appointment._id
            }
        });

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
            .populate('patientId', 'firstName lastName email phone role cnamId')
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
            .populate('patientId', 'firstName lastName email phone role cnamId')
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
        ).populate('patientId', 'firstName lastName email phone role cnamId')
         .populate('providerId', 'firstName lastName specialization role');

        // Create notifications for status changes
        if (filteredUpdates.status && appointment.status !== filteredUpdates.status) {
            const isDoctor = userId === appointment.providerId.toString();
            const isPatient = userId === appointment.patientId.toString();
            
            // Determine who should receive the notification
            let notificationUserId;
            let notificationData: any = {};
            
            if (isDoctor && filteredUpdates.status === 'confirmed') {
                // Doctor confirmed appointment, notify patient
                notificationUserId = appointment.patientId._id;
                notificationData = {
                    type: 'appointment_confirmed',
                    title: 'appointmentConfirmed',
                    message: 'appointmentConfirmedMessage',
                    translationData: {
                        doctorName: `${(updatedAppointment!.providerId as any).firstName} ${(updatedAppointment!.providerId as any).lastName}`,
                        date: new Date(updatedAppointment!.scheduledDate).toLocaleDateString()
                    },
                    priority: 'high'
                };
            } else if (isDoctor && filteredUpdates.status === 'cancelled') {
                // Doctor cancelled appointment, notify patient
                notificationUserId = appointment.patientId._id;
                notificationData = {
                    type: 'appointment_cancelled',
                    title: 'appointmentCancelled',
                    message: 'appointmentCancelledByDoctor',
                    translationData: {
                        doctorName: `${(updatedAppointment!.providerId as any).firstName} ${(updatedAppointment!.providerId as any).lastName}`,
                        date: new Date(updatedAppointment!.scheduledDate).toLocaleDateString()
                    },
                    priority: 'high'
                };
            } else if (isPatient && filteredUpdates.status === 'cancelled') {
                // Patient cancelled appointment, notify doctor
                notificationUserId = appointment.providerId._id;
                notificationData = {
                    type: 'appointment_cancelled',
                    title: 'appointmentCancelled',
                    message: 'appointmentCancelledByPatient',
                    translationData: {
                        patientName: `${(updatedAppointment!.patientId as any).firstName} ${(updatedAppointment!.patientId as any).lastName}`,
                        date: new Date(updatedAppointment!.scheduledDate).toLocaleDateString()
                    },
                    priority: 'medium'
                };
            }
            
            // Create notification if we have data
            if (notificationUserId && notificationData.type) {
                await Notification.create({
                    userId: notificationUserId,
                    ...notificationData,
                    relatedEntity: {
                        type: 'appointment',
                        id: updatedAppointment!._id
                    }
                });
            }
        }

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
        
        const appointment = await Appointment.findById(id)
            .populate('patientId', 'firstName lastName')
            .populate('providerId', 'firstName lastName specialization');
        
        if (!appointment) {
            res.status(404).json({ message: "Appointment not found" });
            return;
        }

        // Check if user has permission to cancel this appointment
        if (appointment.patientId._id.toString() !== userId && 
            appointment.providerId._id.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        appointment.status = 'cancelled';
        await appointment.save();

        // Create notification for the other party
        const isDoctor = userId === appointment.providerId._id.toString();
        const isPatient = userId === appointment.patientId._id.toString();
        
        if (isDoctor) {
            // Doctor cancelled, notify patient
            await Notification.create({
                userId: appointment.patientId._id,
                type: 'appointment_cancelled',
                title: 'appointmentCancelled',
                message: 'appointmentCancelledByDoctor',
                translationData: {
                    doctorName: `${(appointment.providerId as any).firstName} ${(appointment.providerId as any).lastName}`,
                    date: new Date(appointment.scheduledDate).toLocaleDateString()
                },
                priority: 'high',
                relatedEntity: {
                    type: 'appointment',
                    id: appointment._id
                }
            });
        } else if (isPatient) {
            // Patient cancelled, notify doctor
            await Notification.create({
                userId: appointment.providerId._id,
                type: 'appointment_cancelled',
                title: 'appointmentCancelled',
                message: 'appointmentCancelledByPatient',
                translationData: {
                    patientName: `${(appointment.patientId as any).firstName} ${(appointment.patientId as any).lastName}`,
                    date: new Date(appointment.scheduledDate).toLocaleDateString()
                },
                priority: 'medium',
                relatedEntity: {
                    type: 'appointment',
                    id: appointment._id
                }
            });
        }

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

        // Get provider's slot duration (default 30 min)
        const provider = await User.findById(providerId);
        if (!provider) {
            res.status(404).json({ message: "Provider not found" });
            return;
        }
        const slotDuration = provider.slotDuration || 30;

        // Get booked slots for the date
        const bookedSlots = await Appointment.find({
            providerId,
            scheduledDate: date,
            status: { $nin: ['cancelled', 'no-show'] }
        }).select('scheduledTime');

        const bookedTimes = bookedSlots.map(slot => slot.scheduledTime);

        // Generate available time slots for 24h, using slotDuration
        const timeSlots = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
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
                specialization: provider.specialization,
                slotDuration
            },
            date,
            availableSlots: timeSlots
        });
    } catch (err) {
        console.error('Get available slots error:', err);
        res.status(500).json({ message: "Failed to get available slots", error: err });
    }
};

export const getAvailableSlotsForMonth = async (req: Request, res: Response): Promise<void> => {
    try {
        const { providerId, month } = req.query;
        if (!providerId || !month) {
            res.status(400).json({ message: "Provider ID and month are required" });
            return;
        }
        // Parse month (YYYY-MM)
        const [year, monthNum] = (month as string).split('-').map(Number);
        const daysInMonth = new Date(year, monthNum, 0).getDate();
        const provider = await User.findById(providerId);
        if (!provider) {
            res.status(404).json({ message: "Provider not found" });
            return;
        }
        const slotDuration = provider.slotDuration || 30;
        const result: Record<string, string[]> = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            // Get booked slots for this date
            const bookedSlots = await Appointment.find({
                providerId,
                scheduledDate: dateStr,
                status: { $nin: ['cancelled', 'no-show'] }
            }).select('scheduledTime');
            const bookedTimes = bookedSlots.map(slot => slot.scheduledTime);
            // Generate all slots for 24h
            const slots: string[] = [];
            for (let hour = 0; hour < 24; hour++) {
                for (let minute = 0; minute < 60; minute += slotDuration) {
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    if (!bookedTimes.includes(time)) {
                        slots.push(time);
                    }
                }
            }
            if (slots.length > 0) {
                result[dateStr] = slots;
            }
        }
        res.json(result);
    } catch (err) {
        console.error('Get available slots for month error:', err);
        res.status(500).json({ message: "Failed to get available slots for month", error: err });
    }
};

export const approveAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        
        const appointment = await Appointment.findById(id)
            .populate('patientId', 'firstName lastName')
            .populate('providerId', 'firstName lastName specialization');
        
        if (!appointment) {
            res.status(404).json({ message: "Appointment not found" });
            return;
        }

        // Check if user is the provider for this appointment
        if (appointment.providerId._id.toString() !== userId) {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        // Update appointment status to confirmed
        appointment.status = 'confirmed';
        await appointment.save();

        // Create notification for patient that appointment is confirmed
        await Notification.create({
            userId: appointment.patientId._id,
            type: 'appointment_confirmed',
            title: 'appointmentConfirmed',
            message: 'appointmentConfirmedMessage',
            translationData: {
                doctorName: `${(appointment.providerId as any).firstName} ${(appointment.providerId as any).lastName}`,
                date: new Date(appointment.scheduledDate).toLocaleDateString()
            },
            priority: 'high',
            relatedEntity: {
                type: 'appointment',
                id: appointment._id
            }
        });

        res.json({
            message: "Appointment approved successfully",
            appointment
        });
    } catch (err) {
        console.error('Approve appointment error:', err);
        res.status(500).json({ message: "Failed to approve appointment", error: err });
    }
};