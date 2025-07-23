// Automatically generate transactionId for each item if not present
function assignTransactionIds(items: any[]) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (!item.transactionId) {
      item.transactionId = shortid.generate();
    }
  }
}
import mongoose, { Schema, Document } from 'mongoose';
import shortid from 'shortid';


export interface IItemHistory {
  status: string;
  date: Date;
  by: string;
}

export interface IMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  assignedProvider?: mongoose.Types.ObjectId;
  status?: string;
  transactionId?: string;
  history?: IItemHistory[];
}

export interface ILabTest {
  testName: string;
  notes?: string;
  assignedProvider?: mongoose.Types.ObjectId;
  status?: string;
  transactionId?: string;
  history?: IItemHistory[];
}

export interface IRadiologyExam {
  examName: string;
  notes?: string;
  assignedProvider?: mongoose.Types.ObjectId;
  status?: string;
  transactionId?: string;
  history?: IItemHistory[];
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
  qrCode: string;
}

const itemHistorySchema = new Schema<IItemHistory>({
  status: { type: String, required: true },
  date: { type: Date, default: Date.now },
  by: { type: String, required: true },
}, { _id: false });

const medicationSchema = new Schema<IMedication>({
  name: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  assignedProvider: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'partial', 'partial_accepted', 'rejected', 'ready_for_pickup', 'completed', 'cancelled'],
    default: 'pending'
  },
  transactionId: { type: String },
  history: [itemHistorySchema]
}, { _id: false });

const labTestSchema = new Schema<ILabTest>({
  testName: { type: String, required: true },
  notes: { type: String },
  assignedProvider: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'partial', 'partial_accepted', 'rejected', 'ready_for_pickup', 'completed', 'cancelled'],
    default: 'pending'
  },
  transactionId: { type: String },
  history: [itemHistorySchema]
}, { _id: false });

const radiologySchema = new Schema<IRadiologyExam>({
  examName: { type: String, required: true },
  notes: { type: String },
  assignedProvider: { type: Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'partial', 'partial_accepted', 'rejected', 'ready_for_pickup', 'completed', 'cancelled'],
    default: 'pending'
  },
  transactionId: { type: String },
  history: [itemHistorySchema]
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

// Pre-save hook to assign transactionId to all items if not present
prescriptionSchema.pre<IPrescription>('save', function(next) {
  assignTransactionIds(this.medications);
  assignTransactionIds(this.labTests);
  assignTransactionIds(this.radiology);
  next();
});