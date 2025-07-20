import mongoose from "mongoose";

const medicationDosageSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  unit: { type: String, required: true }, // mg, ml, etc.
  frequency: { type: String, required: true }, // daily, twice daily, etc.
  timing: { type: String }, // morning, evening, with meals, etc.
  duration: { type: String }, // 7 days, 30 days, etc.
  instructions: { type: String } // Take with food, etc.
}, { _id: false });

const medicationHistorySchema = new mongoose.Schema({
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
  medicalRecordId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MedicalRecord'
  },
  medicationName: { type: String, required: true },
  genericName: { type: String },
  medicationType: { 
    type: String, 
    enum: ['prescription', 'over_the_counter', 'supplement', 'herbal'],
    default: 'prescription'
  },
  dosage: medicationDosageSchema,
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'discontinued', 'completed', 'suspended'],
    default: 'active'
  },
  reason: { type: String }, // Why prescribed
  sideEffects: [{ type: String }],
  effectiveness: { 
    type: String, 
    enum: ['effective', 'ineffective', 'unknown', 'causing_side_effects'],
    default: 'unknown'
  },
  notes: { type: String },
  isCurrent: { type: Boolean, default: true },
  refillCount: { type: Number, default: 0 },
  lastRefillDate: { type: Date }
}, { 
  timestamps: true 
});

// Indexes for better performance
medicationHistorySchema.index({ patientId: 1, isCurrent: 1 });
medicationHistorySchema.index({ patientId: 1, startDate: -1 });
medicationHistorySchema.index({ medicationName: 1 });
medicationHistorySchema.index({ status: 1 });

export default mongoose.model("MedicationHistory", medicationHistorySchema); 