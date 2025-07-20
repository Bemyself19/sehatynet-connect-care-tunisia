import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { MedicalRecord } from '@/types/medicalRecord';

export const useAssignedRequests = () => {
  return useQuery<MedicalRecord[], Error>({
    queryKey: ['assignedRequests'],
    queryFn: () => api.getAssignedRequests(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}; 