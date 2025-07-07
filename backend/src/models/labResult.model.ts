import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema({
  testName: { type: String, required: true },
  testCode: { type: String },
  value: { type: String, required: true },
  unit: { type: String },
  referenceRange: {
    min: { type: Number },
    max: { type: Number },
    text: { type: String }
  },
  status: { 
    type: String, 
    enum: ['normal', 'high', 'low', 'critical', 'pending'],
    default: 'normal'
  },
  notes: { type: String }
}, { _id: false });

const labResultSchema = new mongoose.Schema({
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
    ref: 'MedicalRecord',
    required: true 
  },
  labName: { type: String, required: true },
  orderDate: { type: Date, required: true },
  collectionDate: { type: Date },
  resultDate: { type: Date },
  tests: [labTestSchema],
  overallStatus: { 
    type: String, 
    enum: ['normal', 'abnormal', 'critical', 'pending'],
    default: 'pending'
  },
  clinicalNotes: { type: String },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  verifiedAt: { type: Date }
}, { 
  timestamps: true 
});

// Indexes for better performance
labResultSchema.index({ patientId: 1, orderDate: -1 });
labResultSchema.index({ medicalRecordId: 1 });
labResultSchema.index({ overallStatus: 1 });

export default mongoose.model("LabResult", labResultSchema); 