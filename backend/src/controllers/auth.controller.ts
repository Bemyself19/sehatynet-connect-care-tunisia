import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const register = async (req: Request, res: Response): Promise<void> => {
    const { 
        email, 
        nationalId,
        password, 
        firstName, 
        lastName, 
        role, 
        phone, 
        dateOfBirth,
        licenseNumber,
        specialization,
        address,
        cnamId,
        emergencyContact,
        medicalHistory,
        allergies,
        currentMedications
    } = req.body;

    try {
        // Check if email already exists
        const existingByEmail = await User.findOne({ email });
        if (existingByEmail) {
            res.status(400).json({ message: "Email already exists" });
            return;
        }

        // Check if nationalId already exists (if provided)
        if (nationalId) {
            const existingByNationalId = await User.findOne({ nationalId });
            if (existingByNationalId) {
                res.status(400).json({ message: "National ID already exists" });
                return;
            }
        }

        const hashed = await bcrypt.hash(password, 10);
        
        const userData: any = {
            email,
            nationalId,
            password: hashed,
            firstName,
            lastName,
            role,
            phone,
            dateOfBirth,
            cnamId,
            address
        };

        // Add role-specific fields
        if (role === 'patient') {
            userData.emergencyContact = emergencyContact;
            userData.medicalHistory = medicalHistory || [];
            userData.allergies = allergies || [];
            userData.currentMedications = currentMedications || [];
        } else if (['doctor', 'pharmacy', 'lab', 'radiologist'].includes(role)) {
            userData.licenseNumber = licenseNumber;
            userData.specialization = specialization;
        }

        const user = new User(userData);
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET as string, 
            { expiresIn: "1d" }
        );

        res.status(201).json({ 
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                cnamId: user.cnamId,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: "Registration failed", error: err });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { email, nationalId, password, role } = req.body;
    try {
        let user;
        
        // Find user by email or nationalId
        if (email) {
            user = await User.findOne({ email });
        } else if (nationalId) {
            user = await User.findOne({ nationalId });
        } else {
            res.status(400).json({ message: "Email or National ID is required" });
            return;
        }

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.role !== role) {
             res.status(403).json({ message: `You are trying to log in as a ${role}, but your account is a ${user.role}. Please log in with the correct account type.` });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({ message: "Account is not active. Please contact support." });
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(401).json({ message: "Invalid password" });
            return;
        }

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET as string, 
            { expiresIn: "1d" }
        );

        // Fetch the full user profile (excluding password)
        const fullUser = await User.findById(user._id).select('-password');
        res.json({ 
            token, 
            user: fullUser
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: "Login failed", error: err });
    }
};

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
    const { email, password, adminCode } = req.body;
    
    try {
        if (adminCode !== process.env.ADMIN_CODE) {
            res.status(401).json({ message: "Invalid admin code" });
            return;
        }

        const user = await User.findOne({ email, role: 'admin' });
        if (!user) {
            res.status(404).json({ message: "Admin user not found" });
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(401).json({ message: "Invalid password" });
            return;
        }

        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET as string, 
            { expiresIn: "1d" }
        );

        res.json({ 
            token, 
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ message: "Admin login failed", error: err });
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // Always respond with success for security
    res.json({ message: "If an account exists, a reset link has been sent." });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  // Configure your SMTP transporter here
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/reset-password?token=${token}`;
  await transporter.sendMail({
    to: user.email,
    subject: "Password Reset",
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Click <a href=\"${resetUrl}\">here</a> to reset your password. This link will expire in 1 hour.</p>`
  });

  res.json({ message: "If an account exists, a reset link has been sent." });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    res.status(400).json({ message: "Invalid or expired token." });
    return;
  }
  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: "Password has been reset. You can now log in." });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user.id;
    const { 
        email, 
        firstName, 
        lastName, 
        phone, 
        dateOfBirth, 
        address 
    } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { 
                email, 
                firstName, 
                lastName, 
                phone, 
                dateOfBirth, 
                address 
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json(user);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ message: "Failed to update profile", error: err });
    }
};

export const updateMedicalRecordConsent = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.id;
        const userRole = (req as any).user.role;
        const { allowOtherDoctorsAccess } = req.body;

        // Only patients can update this setting
        if (userRole !== 'patient') {
            res.status(403).json({ message: "Only patients can update consent settings" });
            return;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { allowOtherDoctorsAccess: Boolean(allowOtherDoctorsAccess) },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        res.json(user);
    } catch (err) {
        console.error('Update consent error:', err);
        res.status(500).json({ message: "Failed to update consent settings", error: err });
    }
};
