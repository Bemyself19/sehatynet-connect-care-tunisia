export type NotificationType = 
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'prescription_ready'
  | 'lab_results_available'
  | 'medical_record_added'
  | 'payment_due'
  | 'payment_confirmed'
  | 'video_consultation_starting';

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
  relatedEntityId?: string; // ID of related appointment, prescription, etc.
  relatedEntityType?: 'appointment' | 'prescription' | 'labResult' | 'medicalRecord' | 'payment';
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
  relatedEntityId?: string;
  relatedEntityType?: 'appointment' | 'prescription' | 'labResult' | 'medicalRecord' | 'payment';
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
