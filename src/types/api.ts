export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalPatients: number;
  totalProviders: number;
  activeProviders: number;
  verifiedUsers: number;
} 