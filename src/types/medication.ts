// ...existing code...
export type MedicationType = 'prescription' | 'over_the_counter' | 'supplement' | 'herbal';
// ...existing code...
import { User } from './user';

export interface MedicationDosage {
  amount: number;
  unit: string; // mg, ml, etc.
  frequency: string; // daily, twice daily, etc.
  timing?: string; // morning, evening, with meals, etc.
  duration?: string; // 7 days, 30 days, etc.
  instructions?: string; // Take with food, etc.
}

export interface MedicationHistory {
  _id: string;
  patientId: User;
  providerId: User;
  medicalRecordId?: string;
  medicationName: string;
  genericName?: string;
  medicationType: 'prescription' | 'over_the_counter' | 'supplement' | 'herbal';
  dosage: MedicationDosage;
  startDate: string;
  endDate?: string;
  status: 'active' | 'discontinued' | 'completed' | 'suspended';
  reason?: string; // Why prescribed
  sideEffects: string[];
  effectiveness: 'effective' | 'ineffective' | 'unknown' | 'causing_side_effects';
  notes?: string;
  isCurrent: boolean;
  refillCount: number;
  lastRefillDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationHistoryData {
  patientId: string;
  medicalRecordId?: string;
  medicationName: string;
  genericName?: string;
  medicationType?: 'prescription' | 'over_the_counter' | 'supplement' | 'herbal';
  dosage: MedicationDosage;
  startDate: string;
  endDate?: string;
  status?: 'active' | 'discontinued' | 'completed' | 'suspended';
  reason?: string;
  sideEffects?: string[];
  effectiveness?: 'effective' | 'ineffective' | 'unknown' | 'causing_side_effects';
  notes?: string;
}

export interface UpdateMedicationHistoryData {
  medicationName?: string;
  genericName?: string;
  medicationType?: 'prescription' | 'over_the_counter' | 'supplement' | 'herbal';
  dosage?: MedicationDosage;
  endDate?: string;
  status?: 'active' | 'discontinued' | 'completed' | 'suspended';
  reason?: string;
  sideEffects?: string[];
  effectiveness?: 'effective' | 'ineffective' | 'unknown' | 'causing_side_effects';
  notes?: string;
  refillCount?: number;
  lastRefillDate?: string;
}

export interface MedicationInteraction {
  severity: 'low' | 'moderate' | 'high';
  description: string;
  medications: string[];
} 