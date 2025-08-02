import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  translationData?: object;
  data?: object;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  relatedEntity?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'appointment_pending',
      'appointment_confirmed',
      'appointment_cancelled',
      'appointment_reminder',
      'prescription_ready',
      'prescription_updated',
      'prescription_confirmed',
      'lab_result_ready',
      'lab_confirmed',
      'lab_ready',
      'lab_completed',
      'lab_partial_confirmation',
      'imaging_confirmed',
      'imaging_ready',
      'imaging_completed',
      'imaging_partial_confirmation',
      'radiology_result_ready',
      'system_maintenance',
      'general',
      'pharmacy_assignment',
      'lab_assignment',
      'radiology_assignment',
      'prescription_partial_confirmation',
      'prescription_partial_confirmation_need_patient_action',
      'prescription_out_of_stock',
      'prescription_partial_fulfillment',
      'prescription_completed',
      'patient_confirmed_partial'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  translationData: {
    type: Object
  },
  data: {
    type: Object
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'medicalRecord', 'labResult', 'radiologyResult', 'medication', 'lab_result', 'imaging']
    },
    id: {
      type: Schema.Types.ObjectId
    }
  },
  actionUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
