import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { 
        type: String, 
        enum: ["patient", "doctor", "pharmacy", "lab", "radiologist", "admin"], 
        default: "patient" 
    },
    phone: { type: String },
    dateOfBirth: { type: String },
    // Patient-specific field
    gender: { type: String, enum: ['male', 'female', 'other'] },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    cnamId: { type: String },
    
    // Patient-specific fields
    emergencyContact: {
        name: { type: String },
        phone: { type: String },
        relationship: { type: String }
    },
    medicalHistory: [{ type: String, default: [] }],
    allergies: [{ type: String, default: [] }],
    currentMedications: [{ type: String, default: [] }],
    // New field to track if patient dismissed the Q&A modal
    medicalInfoDismissed: { type: Boolean, default: false },
    
    // Provider-specific fields
    licenseNumber: { type: String },
    specialization: { type: String },
    address: { type: String },
    workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '17:00' }
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    consultationFee: { type: Number },
    isActive: { type: Boolean, default: true },
    // Provider-specific: default slot duration in minutes
    slotDuration: { type: Number, default: 30 },
    // Password reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, { 
    timestamps: true 
});

export default mongoose.model("User", userSchema);
