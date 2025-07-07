import { User } from './user';

export interface LabTest {
  testName: string;
  testCode?: string;
  value: string;
  unit?: string;
  referenceRange?: {
    min?: number;
    max?: number;
    text?: string;
  };
  status: 'normal' | 'high' | 'low' | 'critical' | 'pending';
  notes?: string;
}

export interface LabResult {
  _id: string;
  patientId: User;
  providerId: User;
  medicalRecordId: string;
  labName: string;
  orderDate: string;
  collectionDate?: string;
  resultDate?: string;
  tests: LabTest[];
  overallStatus: 'normal' | 'abnormal' | 'critical' | 'pending';
  clinicalNotes?: string;
  isVerified: boolean;
  verifiedBy?: User;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabResultData {
  patientId: string;
  medicalRecordId: string;
  labName: string;
  orderDate: string;
  collectionDate?: string;
  resultDate?: string;
  tests: LabTest[];
  overallStatus?: 'normal' | 'abnormal' | 'critical' | 'pending';
  clinicalNotes?: string;
}

export interface UpdateLabResultData {
  labName?: string;
  collectionDate?: string;
  resultDate?: string;
  tests?: LabTest[];
  overallStatus?: 'normal' | 'abnormal' | 'critical' | 'pending';
  clinicalNotes?: string;
} 