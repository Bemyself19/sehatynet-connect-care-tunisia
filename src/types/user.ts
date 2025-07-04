export type UserRole = 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'radiologist' | 'admin';

export interface BaseUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  cnamId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Patient extends BaseUser {
  role: 'patient';
  dateOfBirth: string;
  address: string;
  phone: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  currentMedications?: string[];
  medicalInfoDismissed?: boolean;
}

export interface Provider extends BaseUser {
  role: 'doctor' | 'pharmacy' | 'lab' | 'radiologist';
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number;
  experience?: string;
  address: string;
  phone: string;
  availability?: string[];
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  slotDuration?: number;
  workingHours?: {
    start: string;
    end: string;
  };
}

export type User = Patient | Provider | BaseUser & { medicalInfoDismissed?: boolean, slotDuration?: number };

export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginCredentials extends LoginForm {
  role: UserRole;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  specialization?: string;
  address?: string;
  cnamId?: string;
  gender?: string;
}
