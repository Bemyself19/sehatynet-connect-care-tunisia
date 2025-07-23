
import { Request, Response } from "express";
import User from "../models/user.model";
import Appointment from '../models/appointment.model';
import TeleExpertiseRequest from '../models/teleExpertiseRequest.model';
import Prescription from '../models/prescription.model';
import mongoose from 'mongoose';

export const searchProvidersByRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, search } = req.query as { role?: string; search?: string };
        if (!role || !['pharmacy', 'lab', 'radiologist'].includes(role)) {
            res.status(400).json({ message: "Invalid or missing provider role" });
            return;
        }
        const query: any = { role, isActive: true };
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } }
            ];
        }
        const providers = await User.find(query).select('firstName lastName specialization address city country rating reviewCount');
        res.json(providers);
        return;
    } catch (err) {
        console.error('Provider search error:', err);
        res.status(500).json({ message: "Failed to search providers", error: err });
        return;
    }
};
// Delete own account (authenticated user)
export const deleteOwnAccount = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        console.error('Delete own account error:', err);
        res.status(500).json({ message: "Failed to delete account", error: err });
    }
};

export const getProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        res.json(user);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ message: "Profile fetch failed", error: err });
    }
};

export const updateProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const updates = req.body;
        const loggedInUserId = req.user.id;
        
        // Only allow certain fields to be updated
        const allowedUpdates = [
            'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender', 'profileImage',
            'emergencyContact', 'medicalHistory', 'allergies', 'currentMedications',
            'specialization', 'address', 'country', 'province', 'city', 'workingHours', 'consultationFee',
            'localConsultationFee', 'internationalConsultationFee',
            'medicalInfoDismissed',
            'slotDuration',
            'allowOtherDoctorsAccess',
            'nationalId', 'cnamId'
        ];
        
        const filteredUpdates: any = {};
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });

        let updated;
        try {
            updated = await User.findByIdAndUpdate(
                loggedInUserId, 
                filteredUpdates, 
                { new: true }
            ).select("-password");
        } catch (dbErr: any) {
            console.error('MongoDB update error:', dbErr);
            if (dbErr.code === 11000 && dbErr.keyPattern && dbErr.keyPattern.nationalId) {
                res.status(400).json({ message: "This National ID is already in use by another account.", error: dbErr });
            } else {
                res.status(500).json({ message: "Profile update failed (DB error)", error: dbErr });
            }
            return;
        }

        if (!updated) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json({
            message: "Profile updated successfully",
            user: updated
        });
        return;
    } catch (err) {
        console.error('Update profile error:', err, 'Request body:', req.body);
        res.status(500).json({ message: "Profile update failed (server error)", error: err, requestBody: req.body });
        return;
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, status, search } = req.query;
        
        let query: any = {};
        
        if (role && role !== 'all') {
            query.role = role;
        }
        
        if (status && status !== 'all') {
            if (status === 'active') {
                query.isActive = true;
            } else if (status === 'inactive') {
                query.isActive = false;
            }
        }
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (err) {
        console.error('Get all users error:', err);
        res.status(500).json({ message: "Failed to fetch users", error: err });
    }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password");
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        
        res.json(user);
    } catch (err) {
        console.error('Get user by ID error:', err);
        res.status(500).json({ message: "Failed to fetch user", error: err });
    }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select("-password");
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        
        res.json({
            message: "User status updated successfully",
            user
        });
    } catch (err) {
        console.error('Update user status error:', err);
        res.status(500).json({ message: "Failed to update user status", error: err });
    }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        
        res.json({
            message: "User deleted successfully"
        });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ message: "Failed to delete user", error: err });
    }
};

export const getProviders = async (req: Request, res: Response): Promise<void> => {
    try {
        const { role, specialization, isActive } = req.query;
        
        let query: any = {
            role: { $in: ['doctor', 'pharmacy', 'lab', 'radiologist'] }
        };
        
        if (role && role !== 'all') {
            query.role = role;
        }
        
        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }
        
        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const providers = await User.find(query)
            .select("-password")
            .sort({ firstName: 1, lastName: 1 });
            
        console.log("Provider fees sample:", providers.slice(0, 2).map(p => ({
            _id: p._id,
            name: `${p.firstName} ${p.lastName}`,
            consultationFee: p.consultationFee,
            localConsultationFee: p.localConsultationFee,
            internationalConsultationFee: p.internationalConsultationFee
        })));

        res.json(providers);
    } catch (err) {
        console.error('Get providers error:', err);
        res.status(500).json({ message: "Failed to fetch providers", error: err });
    }
};

export const getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, isVerified } = req.query;
        const userRole = (req as any).user.role;
        const userId = (req as any).user.id;
        
        let query: any = { role: 'patient' };
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (isVerified !== undefined) {
            query.isVerified = isVerified === 'true';
        }

        let patients;

        // If the requesting user is a doctor, only return patients they have consulted with
        if (userRole === 'doctor') {
            const Appointment = require('../models/appointment.model').default;
            
            // Get distinct patient IDs from appointments where this doctor is the provider
            const appointmentPatientIds = await Appointment.distinct('patientId', { 
                providerId: userId 
            });
            
            // Add patient ID filter to the query
            query._id = { $in: appointmentPatientIds };
            
            patients = await User.find(query)
                .select("-password")
                .sort({ firstName: 1, lastName: 1 });
        } else if (userRole === 'admin') {
            // Admins can see all patients
            patients = await User.find(query)
                .select("-password")
                .sort({ firstName: 1, lastName: 1 });
        } else {
            // Other roles should not have access to patient lists
            res.status(403).json({ message: "Access denied" });
            return;
        }

        res.json(patients);
    } catch (err) {
        console.error('Get patients error:', err);
        res.status(500).json({ message: "Failed to fetch patients", error: err });
    }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const doctorId = (req as any).user.id;
        // Quick stats
        const [
            totalAppointments,
            totalPatients,
            totalTeleExpertise,
            totalPrescriptions
        ] = await Promise.all([
            Appointment.countDocuments({ providerId: doctorId }),
            Appointment.distinct('patientId', { providerId: new mongoose.Types.ObjectId(doctorId) }).then(arr => arr.length),
            TeleExpertiseRequest.countDocuments({ doctorId }),
            Prescription.countDocuments({ providerId: doctorId })
        ]);

        // Appointments over last 7 days
        const today = new Date();
        const last7 = new Date(today);
        last7.setDate(today.getDate() - 6);
        const apptTrends = await Appointment.aggregate([
            { $match: { providerId: new mongoose.Types.ObjectId(doctorId), scheduledDate: { $gte: last7.toISOString().slice(0,10) } } },
            { $group: { _id: "$scheduledDate", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        // Appointment status breakdown
        const apptStatus = await Appointment.aggregate([
            { $match: { providerId: new mongoose.Types.ObjectId(doctorId) } },
            { $group: { _id: "$status", value: { $sum: 1 } } }
        ]);

        // New patients over last 7 days
        const newPatients = await User.aggregate([
            { $match: { role: 'patient', createdAt: { $gte: last7 } } },
            { $lookup: { from: 'appointments', localField: '_id', foreignField: 'patientId', as: 'appts' } },
            { $match: { 'appts.providerId': new mongoose.Types.ObjectId(doctorId) } },
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            totalAppointments,
            totalPatients,
            totalTeleExpertise,
            totalPrescriptions,
            apptTrends,
            apptStatus,
            newPatients
        });
    } catch (err) {
        console.error('Get dashboard stats error:', err);
        res.status(500).json({ message: "Failed to fetch dashboard stats", error: err });
    }
};

// Test function to check users without authentication
export const testUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const userCount = await User.countDocuments();
        const users = await User.find().select("email firstName lastName role createdAt").limit(5);
        
        res.json({
            message: "Database connection test",
            userCount,
            recentUsers: users
        });
    } catch (err) {
        console.error('Test users error:', err);
        res.status(500).json({ message: "Database test failed", error: err });
    }
};

export const getProvidersByType = async (req: Request, res: Response): Promise<void> => {
    try {
        const { type } = req.query;
        const allowedRoles = ['pharmacy', 'lab', 'radiologist'];
        if (!type || typeof type !== 'string' || !allowedRoles.includes(type)) {
            res.status(400).json({ message: 'Invalid or missing provider type' });
            return;
        }
        const providers = await User.find({ role: type, isActive: true }).select('-password');
        res.json(providers);
    } catch (err) {
        console.error('Get providers by type error:', err);
        res.status(500).json({ message: 'Failed to fetch providers', error: err });
    }
};
