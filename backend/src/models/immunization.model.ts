import mongoose from "mongoose";

const immunizationDoseSchema = new mongoose.Schema({
  doseNumber: { type: Number, required: true }, // 1st dose, 2nd dose, etc.
  date: { type: Date, required: true },
  lotNumber: { type: String },
  manufacturer: { type: String },
  administeredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  site: { type: String }, // Left arm, right arm, etc.
  route: { type: String }, // Intramuscular, subcutaneous, etc.
  notes: { type: String }
}, { _id: false });

const immunizationSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  vaccineName: { type: String, required: true },
  vaccineType: { type: String }, // COVID-19, Flu, MMR, etc.
  category: { 
    type: String, 
    enum: ['routine', 'travel', 'occupational', 'catch_up', 'other'],
    default: 'routine'
  },
  doses: [immunizationDoseSchema],
  totalDosesRequired: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['up_to_date', 'overdue', 'incomplete', 'not_applicable'],
    default: 'incomplete'
  },
  nextDueDate: { type: Date },
  contraindications: [{ type: String }],
  adverseReactions: [{ type: String }],
  notes: { type: String },
  isRequired: { type: Boolean, default: true },
  source: { 
    type: String, 
    enum: ['self_reported', 'healthcare_provider', 'immunization_registry', 'other'],
    default: 'healthcare_provider'
  }
}, { 
  timestamps: true 
});

// Indexes for better performance
immunizationSchema.index({ patientId: 1, status: 1 });
immunizationSchema.index({ patientId: 1, vaccineType: 1 });
immunizationSchema.index({ nextDueDate: 1 });
immunizationSchema.index({ vaccineName: 1 });

export default mongoose.model("Immunization", immunizationSchema); 