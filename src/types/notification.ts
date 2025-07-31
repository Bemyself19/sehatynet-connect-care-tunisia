export type NotificationType = 
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'appointment_pending'
  | 'prescription_ready'
  | 'lab_results_available'
  | 'medical_record_added'
  | 'payment_due'
  | 'payment_confirmed'
  | 'video_consultation_starting'
  | 'pharmacy_assignment';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  actionUrl?: string; // URL to navigate to when clicked
  relatedEntity?: {
    type: 'appointment' | 'prescription' | 'labResult' | 'medicalRecord' | 'payment' | 'medication';
    id: string;
  };
  translationData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  actionUrl?: string;
  relatedEntity?: {
    type: 'appointment' | 'prescription' | 'labResult' | 'medicalRecord' | 'payment' | 'medication';
    id: string;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}
