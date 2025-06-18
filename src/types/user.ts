
export type UserRole = 'patient' | 'doctor' | 'pharmacy' | 'lab' | 'radiologist' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  profileImage?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Patient extends User {
  role: 'patient';
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalHistory?: string[];
  allergies?: string[];
  currentMedications?: string[];
}

export interface Provider extends User {
  role: 'doctor' | 'pharmacy' | 'lab' | 'radiologist';
  licenseNumber: string;
  specialization?: string;
  address: string;
  workingHours?: {
    [key: string]: { start: string; end: string; };
  };
  rating?: number;
  reviewCount?: number;
  consultationFee?: number;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
  licenseNumber?: string; // For providers
  specialization?: string; // For doctors
  address?: string; // For providers
}
