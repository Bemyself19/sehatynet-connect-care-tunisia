import { User, Patient, Provider, LoginCredentials } from '@/types/user';
import { Appointment, CreateAppointmentData } from '@/types/appointment';
import { MedicalRecord, CreateMedicalRecordData } from '@/types/medicalRecord';
import { Prescription, CreatePrescriptionData } from '@/types/prescription';
import { DashboardStats } from '@/types/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = sessionStorage.getItem('authToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json', // Ensure JSON content type
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle responses with no content
      const text = await response.text();
      return text ? JSON.parse(text) : ({} as T);

    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async register(data: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginCredentials): Promise<{ token: string; user: User }> {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adminLogin(data: { email: string; password: string; adminCode: string }) {
    return this.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User Management
  async getProfile(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAllUsers(params?: { role?: string; status?: string; search?: string }): Promise<User[]> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<User[]>(`/users${queryString}`);
  }

  async getProviders(params?: { role?: string; specialization?: string; isActive?: boolean }): Promise<Provider[]> {
    if (params) {
      const stringParams: Record<string, string> = {};
      if (params.role) stringParams.role = params.role;
      if (params.specialization) stringParams.specialization = params.specialization;
      if (params.isActive !== undefined) stringParams.isActive = params.isActive.toString();
      const queryString = `?${new URLSearchParams(stringParams).toString()}`;
      return this.request<Provider[]>(`/users/providers${queryString}`);
    }
    return this.request<Provider[]>('/users/providers');
  }

  async getPatients(params?: { search?: string; isVerified?: boolean }): Promise<Patient[]> {
    if (params) {
      const stringParams: Record<string, string> = {};
      if (params.search) stringParams.search = params.search;
      if (params.isVerified !== undefined) stringParams.isVerified = params.isVerified.toString();
      const queryString = `?${new URLSearchParams(stringParams).toString()}`;
      return this.request<Patient[]>(`/users/patients${queryString}`);
    }
    return this.request<Patient[]>('/users/patients');
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/users/stats');
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>('/appointments');
  }

  async getAvailableSlots(providerId: string, date: string): Promise<{ availableSlots: string[] }> {
    return this.request<{ availableSlots: string[] }>(`/appointments/slots?providerId=${providerId}&date=${date}`);
  }

  async getAppointment(id: string): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`);
  }

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelAppointment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // Medical Records
  async createMedicalRecord(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    return this.request<MedicalRecord>('/medical-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>('/medical-records');
  }

  async getPatientMedicalHistory(patientId: string): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>(`/medical-records/patient/${patientId}`);
  }

  async getMedicalRecord(id: string): Promise<MedicalRecord> {
    return this.request<MedicalRecord>(`/medical-records/${id}`);
  }

  async updateMedicalRecord(id: string, data: Partial<MedicalRecord>): Promise<MedicalRecord> {
    return this.request<MedicalRecord>(`/medical-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMedicalRecord(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/medical-records/${id}`, {
      method: 'DELETE',
    });
  }

  async updateMedicalRecordPrivacy(id: string, privacyLevel: string): Promise<any> {
    return this.request(`/medical-records/${id}/privacy`, {
      method: 'PATCH',
      body: JSON.stringify({ privacyLevel })
    });
  }

  // Prescriptions
  async createPrescription(data: CreatePrescriptionData): Promise<Prescription> {
    return this.request<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPrescriptions(): Promise<Prescription[]> {
    return this.request<Prescription[]>('/prescriptions');
  }

  async getAvailableProviders(type: string): Promise<User[]> {
    return this.request<User[]>(`/prescriptions/providers?type=${type}`);
  }

  async verifyPrescription(qrCode: string): Promise<Prescription> {
    return this.request<Prescription>(`/prescriptions/verify/${qrCode}`);
  }

  async getPrescription(id: string): Promise<Prescription> {
    return this.request<Prescription>(`/prescriptions/${id}`);
  }

  async updatePrescription(id: string, data: Partial<Prescription>): Promise<Prescription> {
    return this.request<Prescription>(`/prescriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async fulfillPrescription(id: string): Promise<Prescription> {
    return this.request<Prescription>(`/prescriptions/fulfill/${id}`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const response = await this.request<Appointment>(`/appointments/${id}`);
    return response;
  }

  async createAppointment(appointmentData: Partial<Appointment>): Promise<Appointment> {
    const response = await this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return response;
  }

  // Get patient dashboard with all related data
  async getPatientDashboard(patientId?: string): Promise<any> {
    const params = patientId ? `?patientId=${patientId}` : '';
    return this.request(`/medical-records/dashboard${params}`);
  }

  // Specialties
  async getSpecialties(): Promise<any[]> {
    return this.request<any[]>('/specialties');
  }

  async addSpecialty(data: { name: string; description?: string }): Promise<any> {
    return this.request<any>('/specialties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tele-expertise Requests
  async createTeleExpertiseRequest(data: { patientId: string; doctorId: string; specialty: string; details?: string }): Promise<any> {
    return this.request<any>('/tele-expertise-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTeleExpertiseRequests(): Promise<any[]> {
    return this.request<any[]>('/tele-expertise-requests');
  }

  async updateUserStatus(userId: string, data: { isActive: boolean }): Promise<any> {
    return this.request(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string): Promise<any> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateTeleExpertiseRequest(id: string, data: { status?: string; response?: string; reportUrl?: string }): Promise<any> {
    return this.request<any>(`/tele-expertise-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadTeleExpertiseReport(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = sessionStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/tele-expertise-requests/${id}/report`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload report');
    }
    return response.json();
  }

  async getUserById(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async setMedicalInfoDismissed(dismissed: boolean): Promise<User> {
    return this.updateProfile({ medicalInfoDismissed: dismissed });
  }

  async getDoctorNotes(patientId: string): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>(`/medical-records/patient/${patientId}/notes`);
  }

  async getProvidersByType(type: string): Promise<User[]> {
    return this.request<User[]>(`/users/providers/by-type?type=${type}`);
  }

  async assignProviderToMedicalRecord(recordId: string, type: string, providerId: string): Promise<any> {
    return this.request(`/medical-records/${recordId}/assign-provider`, {
      method: 'POST',
      body: JSON.stringify({ type, providerId })
    });
  }

  async getMedicalRecordsByPrescriptionId(prescriptionId: string): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>(`/medical-records/by-prescription/${prescriptionId}`);
  }

  async getAssignedRequests(): Promise<MedicalRecord[]> {
    return this.request<MedicalRecord[]>(`/medical-records/assigned`);
  }

  async fulfillAssignedRequest(id: string, data: { status: string; feedback?: string; resultFileUrl?: string }): Promise<any> {
    return this.request(`/medical-records/${id}/fulfill`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async cancelMedicalRecordRequest(id: string): Promise<any> {
    return this.request(`/medical-records/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  async acceptPartialPharmacyOrder(id: string): Promise<any> {
    return this.fulfillAssignedRequest(id, { status: 'ready_for_pickup' });
  }

  async reassignPharmacy(id: string, pharmacyId: string): Promise<any> {
    return this.request(`/medical-records/${id}/reassign-pharmacy`, {
      method: 'POST',
      body: JSON.stringify({ pharmacyId }),
    });
  }

  async uploadLabRadiologyReport(recordId: string, files: File[], report: any, status?: string): Promise<any> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (report) formData.append('report', JSON.stringify(report));
    if (status) formData.append('status', status);
    const token = sessionStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/medical-records/${recordId}/upload-report`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload report');
    }
    return response.json();
  }

  async uploadTeleExpertisePatientFile(id: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = sessionStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/tele-expertise-requests/${id}/patient-file`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getAvailableSlotsForMonth(providerId: string, month: string): Promise<Record<string, string[]>> {
    return this.request<Record<string, string[]>>(`/appointments/slots/month?providerId=${providerId}&month=${month}`);
  }

  // Payment methods
  async createPaymentSession(data: { appointmentId: string; paymentMethod: string }): Promise<any> {
    return this.request<any>('/payments/session', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    return this.request<any>(`/payments/${paymentId}/status`);
  }

  async getPaymentHistory(): Promise<any[]> {
    return this.request<any[]>('/payments/history');
  }
}

const api = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');
export default api;
