
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
export type AppointmentType = 'consultation' | 'follow-up' | 'emergency' | 'lab-test' | 'imaging';

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string;
  duration: number; // in minutes
  consultationFee: number;
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  prescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSlot {
  id: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CreateAppointmentData {
  providerId: string;
  type: AppointmentType;
  scheduledDate: string;
  duration: number;
  symptoms?: string;
  notes?: string;
}
