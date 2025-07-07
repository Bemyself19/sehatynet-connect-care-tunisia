import { User } from './user';

export interface AllergyReaction {
  reaction: string; // rash, swelling, difficulty breathing, etc.
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onsetTime?: string; // immediate, within hours, etc.
  notes?: string;
}

export interface Allergy {
  _id: string;
  patientId: User;
  allergenName: string;
  allergenType: 'medication' | 'food' | 'environmental' | 'insect' | 'latex' | 'other';
  category?: string; // Antibiotics, nuts, pollen, etc.
  reactions: AllergyReaction[];
  firstOccurrence?: string;
  lastOccurrence?: string;
  status: 'active' | 'resolved' | 'unknown';
  confirmedBy?: User;
  confirmedAt?: string;
  notes?: string;
  isHighRisk: boolean;
  emergencyInstructions?: string; // What to do in case of exposure
  avoidanceInstructions?: string; // How to avoid exposure
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllergyData {
  patientId: string;
  allergenName: string;
  allergenType: 'medication' | 'food' | 'environmental' | 'insect' | 'latex' | 'other';
  category?: string;
  reactions?: AllergyReaction[];
  firstOccurrence?: string;
  lastOccurrence?: string;
  status?: 'active' | 'resolved' | 'unknown';
  notes?: string;
  isHighRisk?: boolean;
  emergencyInstructions?: string;
  avoidanceInstructions?: string;
}

export interface UpdateAllergyData {
  allergenName?: string;
  allergenType?: 'medication' | 'food' | 'environmental' | 'insect' | 'latex' | 'other';
  category?: string;
  reactions?: AllergyReaction[];
  firstOccurrence?: string;
  lastOccurrence?: string;
  status?: 'active' | 'resolved' | 'unknown';
  notes?: string;
  isHighRisk?: boolean;
  emergencyInstructions?: string;
  avoidanceInstructions?: string;
} 