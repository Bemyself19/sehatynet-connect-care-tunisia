import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  mimetype: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const reportSchema = new mongoose.Schema({
  findings: { type: String },
  impressions: { type: String },
  notes: { type: String },
  // Add more structured fields as needed
}, { _id: false });

const medicalRecordSchema = new mongoose.Schema({
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
    appointmentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Appointment' 
    },
    title: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['lab_result', 'consultation', 'imaging', 'prescription', 'vaccination', 'surgery'],
        required: true 
    },
    date: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, required: true }, // Flexible object for different record types
    // For prescription records, details may include:
    //   assignedPharmacyId: ObjectId,
    //   assignedLabId: ObjectId,
    //   assignedRadiologistId: ObjectId
    fileUrl: { type: String }, // For uploaded documents (legacy)
    files: [fileSchema], // For multiple uploaded files
    report: reportSchema, // For structured report fields
    isPrivate: { type: Boolean, default: false },
    privacyLevel: { 
        type: String, 
        enum: ['private', 'doctor_only', 'patient_visible', 'shared'],
        default: 'doctor_only' // Default to doctor-only for consultation notes
    },
    tags: [{ type: String }],
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }, // For lab, radiology, and pharmacy records linked to a prescription
    status: {
        type: String,
        enum: ['pending', 'ready_for_pickup', 'completed', 'cancelled', 'partially_fulfilled', 'out_of_stock'], // pending: new/requested, ready_for_pickup: pharmacy prepared, completed: picked up, cancelled: not fulfilled, partially_fulfilled: some meds unavailable, out_of_stock: none available
        default: 'pending',
    },
}, { 
    timestamps: true 
});

export default mongoose.model("MedicalRecord", medicalRecordSchema); 