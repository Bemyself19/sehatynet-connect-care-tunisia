import { Request, Response } from "express";
import User from "../models/user.model";

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
            'specialization', 'address', 'workingHours', 'consultationFee',
            'medicalInfoDismissed'
        ];
        
        const filteredUpdates: any = {};
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });

        const updated = await User.findByIdAndUpdate(
            loggedInUserId, 
            filteredUpdates, 
            { new: true }
        ).select("-password");

        if (!updated) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json({
            message: "Profile updated successfully",
            user: updated
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: "Profile update failed", error: err });
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

        res.json(providers);
    } catch (err) {
        console.error('Get providers error:', err);
        res.status(500).json({ message: "Failed to fetch providers", error: err });
    }
};

export const getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, isVerified } = req.query;
        
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

        const patients = await User.find(query)
            .select("-password")
            .sort({ firstName: 1, lastName: 1 });

        res.json(patients);
    } catch (err) {
        console.error('Get patients error:', err);
        res.status(500).json({ message: "Failed to fetch patients", error: err });
    }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const patients = await User.countDocuments({ role: 'patient' });
        const doctors = await User.countDocuments({ role: 'doctor' });
        const admins = await User.countDocuments({ role: 'admin' });

        res.json({
            totalUsers,
            activeUsers,
            patients,
            doctors,
            admins
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
