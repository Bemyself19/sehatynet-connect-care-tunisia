import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  translationData?: object;
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
      'lab_result_ready',
      'radiology_result_ready',
      'system_maintenance',
      'general',
      'pharmacy_assignment',
      'lab_assignment',
      'radiology_assignment'
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
      enum: ['appointment', 'prescription', 'medicalRecord', 'labResult', 'radiologyResult', 'medication']
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
