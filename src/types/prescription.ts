import { User, Provider } from './user';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface LabTest {
  testName: string;
  notes?: string;
}

export interface RadiologyExam {
  examName: string;
  notes?: string;
}

export interface Prescription {
  _id: string;
  prescriptionId: string;
  patientId: User;
  providerId: Provider;
  appointmentId: string; // Assuming we'll link to an appointment ID
  medications: Medication[];
  labTests: LabTest[];
  radiology: RadiologyExam[];
  notes?: string;
  status: 'new' | 'filled' | 'cancelled';
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrescriptionData {
  patientId: string;
  appointmentId: string;
  medications: Medication[];
  notes?: string;
} 