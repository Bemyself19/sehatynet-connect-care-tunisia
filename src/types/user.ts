export type UserRole = 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'radiologist' | 'admin';

export interface BaseUser {
  _id: string;
  email: string;
  nationalId?: string; // Tunisian National ID (8 digits)
  googleId?: string; // Google SSO ID
  authProvider?: 'local' | 'google'; // Authentication provider
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
  country?: string;
  province?: string;
  city?: string;
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
  allowOtherDoctorsAccess?: boolean;
}

export interface Provider extends BaseUser {
  role: 'doctor' | 'pharmacy' | 'lab' | 'radiologist';
  specialization?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  consultationFee?: number; // Legacy field, used for local fee in TND
  localConsultationFee?: number; // Fee in TND for local patients
  internationalConsultationFee?: number; // Fee in EUR for international patients
  experience?: string;
  address: string;
  phone: string;
  country?: string;
  province?: string;
  city?: string;
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

export type User = Patient | Provider | BaseUser & { medicalInfoDismissed?: boolean, allowOtherDoctorsAccess?: boolean, slotDuration?: number };

export interface LoginForm {
  email?: string;
  nationalId?: string;
  password: string;
  loginType?: 'email' | 'nationalId';
}

export interface LoginCredentials extends LoginForm {
  role: UserRole;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  role: UserRole;
  nationalId?: string; // Tunisian National ID (8 digits)
  phone?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  specialization?: string;
  address?: string;
  country?: string;
  province?: string;
  city?: string;
  cnamId?: string;
  gender?: string;
}
