import { useQuery } from '@tanstack/react-query';
import { useUser } from './useUser';
import api from '@/lib/api';
import { Prescription } from '@/types/prescription';

export const usePrescriptions = () => {
  const { user } = useUser();

  const {
    data: prescriptions,
    isLoading,
    isError,
    error,
  } = useQuery<Prescription[], Error>({
    queryKey: ['prescriptions', user?._id],
    queryFn: () => api.getPrescriptions(),
    enabled: !!user, // Only run the query if the user is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { prescriptions, isLoading, isError, error };
}; 