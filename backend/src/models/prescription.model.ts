import mongoose, { Schema, Document } from 'mongoose';
import shortid from 'shortid';

export interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface ILabTest {
  testName: string;
  notes?: string;
}

export interface IRadiologyExam {
  examName: string;
  notes?: string;
}

export interface IPrescription extends Document {
  prescriptionId: string;
  patientId: Schema.Types.ObjectId;
  providerId: Schema.Types.ObjectId;
  appointmentId: Schema.Types.ObjectId;
  medications: IMedication[];
  labTests: ILabTest[];
  radiology: IRadiologyExam[];
  notes?: string;
  status: 'new' | 'filled' | 'cancelled';
  qrCode: string;
}

const medicationSchema = new Schema<IMedication>({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
}, { _id: false });

const labTestSchema = new Schema<ILabTest>({
  testName: { type: String, required: true },
  notes: { type: String }
}, { _id: false });

const radiologySchema = new Schema<IRadiologyExam>({
  examName: { type: String, required: true },
  notes: { type: String }
}, { _id: false });

const prescriptionSchema = new Schema<IPrescription>({
  prescriptionId: {
    type: String,
    unique: true,
    default: shortid.generate
  },
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
  medications: [medicationSchema],
  labTests: [labTestSchema],
  radiology: [radiologySchema],
  notes: { type: String },
  status: {
    type: String,
    enum: ['new', 'filled', 'cancelled'],
    default: 'new'
  },
  qrCode: { type: String } // Will store the data for the QR code
}, {
  timestamps: true
});

// Pre-save hook to generate QR code data from the unique prescriptionId
prescriptionSchema.pre<IPrescription>('save', function(next) {
  if (this.isNew) {
    this.qrCode = this.prescriptionId;
  }
  next();
});

export default mongoose.model<IPrescription>('Prescription', prescriptionSchema); 