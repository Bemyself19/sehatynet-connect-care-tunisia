import { User } from './user';
import { Appointment } from './appointment';

export interface MedicalRecord {
  _id: string;
  patientId: User;
  providerId: User;
  appointmentId?: Appointment;
  title: string;
  type: 'lab_result' | 'consultation' | 'imaging' | 'prescription' | 'vaccination' | 'surgery' | 'doctor_note';
  date: string;
  details: any;
  fileUrl?: string;
  isPrivate: boolean;
  privacyLevel: 'private' | 'doctor_only' | 'patient_visible' | 'shared';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status?: string;
  prescriptionId?: string;
  files?: { filename: string; url: string; mimetype: string; uploadedAt?: string }[];
  report?: Record<string, any>;
}

export interface CreateMedicalRecordData {
    patientId: string;
    appointmentId?: string;
    title: string;
    type: 'lab_result' | 'consultation' | 'imaging' | 'prescription' | 'vaccination' | 'surgery' | 'doctor_note';
    date: string;
    details: any;
    fileUrl?: string;
    isPrivate?: boolean;
    privacyLevel?: 'private' | 'doctor_only' | 'patient_visible' | 'shared';
    tags?: string[];
    prescriptionId?: string;
} 