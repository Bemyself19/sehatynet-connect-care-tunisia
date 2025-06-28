import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  status: { type: String, enum: ['Success', 'Failed'], required: true },
  ipAddress: { type: String },
  details: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

auditLogSchema.index({ timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema); 