import { User } from './user';

export interface ImmunizationDose {
  doseNumber: number; // 1st dose, 2nd dose, etc.
  date: string;
  lotNumber?: string;
  manufacturer?: string;
  administeredBy?: User;
  site?: string; // Left arm, right arm, etc.
  route?: string; // Intramuscular, subcutaneous, etc.
  notes?: string;
}

export interface Immunization {
  _id: string;
  patientId: User;
  vaccineName: string;
  vaccineType?: string; // COVID-19, Flu, MMR, etc.
  category: 'routine' | 'travel' | 'occupational' | 'catch_up' | 'other';
  doses: ImmunizationDose[];
  totalDosesRequired: number;
  status: 'up_to_date' | 'overdue' | 'incomplete' | 'not_applicable';
  nextDueDate?: string;
  contraindications: string[];
  adverseReactions: string[];
  notes?: string;
  isRequired: boolean;
  source: 'self_reported' | 'healthcare_provider' | 'immunization_registry' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface CreateImmunizationData {
  patientId: string;
  vaccineName: string;
  vaccineType?: string;
  category?: 'routine' | 'travel' | 'occupational' | 'catch_up' | 'other';
  doses: ImmunizationDose[];
  totalDosesRequired?: number;
  nextDueDate?: string;
  contraindications?: string[];
  adverseReactions?: string[];
  notes?: string;
  isRequired?: boolean;
  source?: 'self_reported' | 'healthcare_provider' | 'immunization_registry' | 'other';
}

export interface UpdateImmunizationData {
  vaccineName?: string;
  vaccineType?: string;
  category?: 'routine' | 'travel' | 'occupational' | 'catch_up' | 'other';
  doses?: ImmunizationDose[];
  totalDosesRequired?: number;
  nextDueDate?: string;
  contraindications?: string[];
  adverseReactions?: string[];
  notes?: string;
  isRequired?: boolean;
  source?: 'self_reported' | 'healthcare_provider' | 'immunization_registry' | 'other';
}

export interface AddDoseData {
  doseNumber: number;
  date: string;
  lotNumber?: string;
  manufacturer?: string;
  site?: string;
  route?: string;
  notes?: string;
}

export interface ImmunizationSchedule {
  upToDate: Immunization[];
  overdue: Immunization[];
  incomplete: Immunization[];
  upcoming: Immunization[];
} 