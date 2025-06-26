import mongoose from 'mongoose';

const teleExpertiseRequestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialty: { type: String, required: true },
  details: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  response: { type: String },
  reportUrl: { type: String },
  patientFileUrl: { type: String },
}, { timestamps: true });

export default mongoose.model('TeleExpertiseRequest', teleExpertiseRequestSchema); 