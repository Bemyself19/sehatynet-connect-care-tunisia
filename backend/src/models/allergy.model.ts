import mongoose from "mongoose";

const allergyReactionSchema = new mongoose.Schema({
  reaction: { type: String, required: true }, // rash, swelling, difficulty breathing, etc.
  severity: { 
    type: String, 
    enum: ['mild', 'moderate', 'severe', 'life_threatening'],
    required: true 
  },
  onsetTime: { type: String }, // immediate, within hours, etc.
  notes: { type: String }
}, { _id: false });

const allergySchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  allergenName: { type: String, required: true },
  allergenType: { 
    type: String, 
    enum: ['medication', 'food', 'environmental', 'insect', 'latex', 'other'],
    required: true 
  },
  category: { type: String }, // Antibiotics, nuts, pollen, etc.
  reactions: [allergyReactionSchema],
  firstOccurrence: { type: Date },
  lastOccurrence: { type: Date },
  status: { 
    type: String, 
    enum: ['active', 'resolved', 'unknown'],
    default: 'active'
  },
  confirmedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  confirmedAt: { type: Date },
  notes: { type: String },
  isHighRisk: { type: Boolean, default: false },
  emergencyInstructions: { type: String }, // What to do in case of exposure
  avoidanceInstructions: { type: String } // How to avoid exposure
}, { 
  timestamps: true 
});

// Indexes for better performance
allergySchema.index({ patientId: 1, status: 1 });
allergySchema.index({ patientId: 1, allergenType: 1 });
allergySchema.index({ allergenName: 1 });
allergySchema.index({ isHighRisk: 1 });

export default mongoose.model("Allergy", allergySchema); 