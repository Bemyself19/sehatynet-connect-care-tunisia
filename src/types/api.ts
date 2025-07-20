export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  totalAppointments: number;
  totalPatients: number;
  totalTeleExpertise: number;
  totalPrescriptions: number;
  apptTrends: { _id: string; count: number }[];
  apptStatus: { _id: string; value: number }[];
  newPatients: { _id: string; count: number }[];
} 