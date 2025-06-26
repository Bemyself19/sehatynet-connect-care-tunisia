import { User, Patient, Provider } from './user';

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'pending';
export type AppointmentType = 'consultation' | 'follow-up' | 'emergency' | 'lab-test' | 'imaging';
export type AppointmentKind = 'in-person' | 'video';

export interface Appointment {
  _id: string;
  patientId: Patient;
  providerId: Provider;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledDate: string;
  scheduledTime: string;
  appointmentType: AppointmentKind;
  reason?: string;
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
  scheduledTime: string;
  appointmentType: AppointmentKind;
  reason?: string;
  duration: number;
  symptoms?: string;
  notes?: string;
}
