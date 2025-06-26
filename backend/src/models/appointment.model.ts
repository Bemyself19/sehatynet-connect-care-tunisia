import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    providerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['consultation', 'follow-up', 'emergency', 'lab-test', 'imaging'],
        default: 'consultation'
    },
    status: { 
        type: String, 
        enum: ['pending', 'scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
    scheduledDate: { type: String, required: true },
    scheduledTime: { type: String, required: true },
    duration: { type: Number, default: 30 }, // in minutes
    consultationFee: { type: Number },
    notes: { type: String },
    symptoms: { type: String },
    diagnosis: { type: String },
    prescription: { type: String },
    appointmentType: { 
        type: String, 
        enum: ['in-person', 'video'],
        default: 'in-person'
    },
    reason: { type: String }
}, { 
    timestamps: true 
});

export default mongoose.model("Appointment", appointmentSchema); 