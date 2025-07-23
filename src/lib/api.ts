import { User, Patient, Provider, LoginCredentials } from '@/types/user';
import { Appointment, CreateAppointmentData } from '@/types/appointment';
import { MedicalRecord, CreateMedicalRecordData } from '@/types/medicalRecord';
import { Prescription, CreatePrescriptionData } from '@/types/prescription';
import { DashboardStats } from '@/types/api';
import { LabResult, CreateLabResultData, UpdateLabResultData } from '@/types/labResult';
import { MedicationHistory, CreateMedicationHistoryData, UpdateMedicationHistoryData, MedicationInteraction } from '@/types/medication';
import { Allergy, CreateAllergyData, UpdateAllergyData } from '@/types/allergy';
import { Immunization, CreateImmunizationData, UpdateImmunizationData, AddDoseData, ImmunizationSchedule } from '@/types/immunization';

class ApiClient {
  // Prescription item status updates
  // Prescription item status updates
  async setPrescriptionItemReadyForPickup(prescriptionId: string, type: 'medication' | 'lab' | 'radiology', itemIndex: number): Promise<any> {
    return this.request(`/prescriptions/${prescriptionId}/item/ready-for-pickup`, {
      method: 'PATCH',
      body: JSON.stringify({ type, itemIndex }),
    });
  }

  async setPrescriptionItemCompleted(prescriptionId: string, type: 'medication' | 'lab' | 'radiology', itemIndex: number): Promise<any> {
    return this.request(`/prescriptions/${prescriptionId}/item/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ type, itemIndex }),
    });
  }
  // ...existing code...

  // Account Deletion
  async deleteOwnAccount(): Promise<void> {
    return this.request<void>(`/users/me`, {
      method: 'DELETE',
    });
  }
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
    console.log('[API] sessionStorage authToken:', token);

    // Always set Authorization header if token exists
    let baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
    if (token) {
      baseHeaders['Authorization'] = `Bearer ${token}`;
      console.log('[API] Authorization header set:', baseHeaders['Authorization']);
    } else {
      console.warn('[API] No authToken found in sessionStorage when making request to', endpoint);
    }
    if (options.headers && !(options.headers instanceof Headers) && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
      baseHeaders = { ...baseHeaders, ...options.headers };
    }
    const headers: HeadersInit = baseHeaders;

    // Debug: log headers before fetch
    console.log('API request headers:', headers);

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Debug: log config before fetch
    console.log('API request config:', config);

    try {
      const response = await fetch(url, config);

      // Only require Authorization header for protected endpoints
      const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/google-auth',
        '/auth/admin-login'
      ];
      const isPublic = publicEndpoints.some(pub => endpoint.startsWith(pub));
      if (!isPublic && !headers['Authorization']) {
        throw new Error('Authorization header missing! Token at request time: ' + token);
      }

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

  async googleAuth(data: { credential: string; role: string }): Promise<{ token: string; user: User; message: string }> {
    return this.request<{ token: string; user: User; message: string }>('/auth/google-auth', {
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

  async getDoctorNotes(patientId: string, doctorId?: string): Promise<MedicalRecord[]> {
    const queryParam = doctorId ? `?doctorId=${doctorId}` : '';
    return this.request<MedicalRecord[]>(`/medical-records/patient/${patientId}/notes${queryParam}`);
  }

  async getDoctorOnlyMedicalRecords(patientId: string, doctorId?: string): Promise<MedicalRecord[]> {
    const queryParam = doctorId ? `?doctorId=${doctorId}` : '';
    return this.request<MedicalRecord[]>(`/medical-records/patient/${patientId}${queryParam}`);
  }

  async updateMedicalRecordConsent(allowOtherDoctorsAccess: boolean): Promise<User> {
    return this.request<User>('/users/me/consent', {
      method: 'PUT',
      body: JSON.stringify({ allowOtherDoctorsAccess }),
    });
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

  // Lab Results API
  async createLabResult(data: CreateLabResultData): Promise<LabResult> {
    return this.request<LabResult>('/lab-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLabResults(params?: { patientId?: string }): Promise<LabResult[]> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<LabResult[]>(`/lab-results${queryString}`);
  }

  async getLabResult(id: string): Promise<LabResult> {
    return this.request<LabResult>(`/lab-results/${id}`);
  }

  async updateLabResult(id: string, data: UpdateLabResultData): Promise<LabResult> {
    return this.request<LabResult>(`/lab-results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async verifyLabResult(id: string): Promise<LabResult> {
    return this.request<LabResult>(`/lab-results/${id}/verify`, {
      method: 'PATCH',
    });
  }

  async getLabResultsByPatient(patientId: string): Promise<LabResult[]> {
    return this.request<LabResult[]>(`/lab-results/patient/${patientId}`);
  }

  async getCriticalLabResults(): Promise<LabResult[]> {
    return this.request<LabResult[]>('/lab-results/critical/all');
  }

  // Medication History API
  async createMedicationHistory(data: CreateMedicationHistoryData): Promise<MedicationHistory> {
    return this.request<MedicationHistory>('/medications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMedicationHistory(params?: { patientId?: string; status?: string; isCurrent?: boolean }): Promise<MedicationHistory[]> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<MedicationHistory[]>(`/medications${queryString}`);
  }

  async getMedicationHistoryById(id: string): Promise<MedicationHistory> {
    return this.request<MedicationHistory>(`/medications/${id}`);
  }

  async updateMedicationHistory(id: string, data: UpdateMedicationHistoryData): Promise<MedicationHistory> {
    return this.request<MedicationHistory>(`/medications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async discontinueMedication(id: string, data: { reason?: string; notes?: string }): Promise<MedicationHistory> {
    return this.request<MedicationHistory>(`/medications/${id}/discontinue`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCurrentMedications(patientId: string): Promise<MedicationHistory[]> {
    return this.request<MedicationHistory[]>(`/medications/patient/${patientId}/current`);
  }

  async getMedicationInteractions(patientId: string): Promise<{ currentMedications: MedicationHistory[]; interactions: MedicationInteraction[] }> {
    return this.request<{ currentMedications: MedicationHistory[]; interactions: MedicationInteraction[] }>(`/medications/patient/${patientId}/interactions`);
  }

  // Allergies API
  async createAllergy(data: CreateAllergyData): Promise<Allergy> {
    return this.request<Allergy>('/allergies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAllergies(params?: { patientId?: string; status?: string; allergenType?: string; isHighRisk?: boolean }): Promise<Allergy[]> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<Allergy[]>(`/allergies${queryString}`);
  }

  async getAllergy(id: string): Promise<Allergy> {
    return this.request<Allergy>(`/allergies/${id}`);
  }

  async updateAllergy(id: string, data: UpdateAllergyData): Promise<Allergy> {
    return this.request<Allergy>(`/allergies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async confirmAllergy(id: string): Promise<Allergy> {
    return this.request<Allergy>(`/allergies/${id}/confirm`, {
      method: 'PATCH',
    });
  }

  async resolveAllergy(id: string, data: { notes?: string }): Promise<Allergy> {
    return this.request<Allergy>(`/allergies/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getHighRiskAllergies(): Promise<Allergy[]> {
    return this.request<Allergy[]>('/allergies/high-risk/all');
  }

  async checkMedicationAllergies(patientId: string, medicationName: string): Promise<{ hasAllergies: boolean; allergies: Allergy[] }> {
    return this.request<{ hasAllergies: boolean; allergies: Allergy[] }>(`/allergies/patient/${patientId}/medication/${medicationName}`);
  }

  // Immunizations API
  async createImmunization(data: CreateImmunizationData): Promise<Immunization> {
    return this.request<Immunization>('/immunizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getImmunizations(params?: { patientId?: string; status?: string; vaccineType?: string; category?: string }): Promise<Immunization[]> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<Immunization[]>(`/immunizations${queryString}`);
  }

  async getImmunization(id: string): Promise<Immunization> {
    return this.request<Immunization>(`/immunizations/${id}`);
  }

  async updateImmunization(id: string, data: UpdateImmunizationData): Promise<Immunization> {
    return this.request<Immunization>(`/immunizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addDose(id: string, data: AddDoseData): Promise<Immunization> {
    return this.request<Immunization>(`/immunizations/${id}/doses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOverdueImmunizations(): Promise<Immunization[]> {
    return this.request<Immunization[]>('/immunizations/overdue/all');
  }

  async getImmunizationSchedule(patientId: string): Promise<ImmunizationSchedule> {
    return this.request<ImmunizationSchedule>(`/immunizations/patient/${patientId}/schedule`);
  }

  // Notification API methods
  async getNotifications(params?: { unread?: boolean; limit?: number; page?: number }): Promise<any> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return this.request<any>(`/notifications${queryString}`);
  }

  async getUnreadNotifications(): Promise<any[]> {
    return this.request<any[]>('/notifications/unread');
  }

  async getNotificationStats(): Promise<any> {
    return this.request<any>('/notifications/stats');
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return this.request<void>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request<void>('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    return this.request<void>(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async createNotification(data: any): Promise<any> {
    return this.request<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // System Settings API methods
  async getSystemSettings(): Promise<any> {
    return this.request<any>('/system-settings');
  }

  async updateSystemSettings(data: any): Promise<any> {
    return this.request<any>('/system-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

const api = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'https://localhost:5000/api');
export default api;
