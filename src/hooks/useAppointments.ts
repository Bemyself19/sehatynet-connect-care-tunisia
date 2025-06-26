import { useQuery } from '@tanstack/react-query';
import { useUser } from './useUser';
import api from '@/lib/api';
import { Appointment } from '@/types/appointment';

export const useAppointments = () => {
  const { user } = useUser();

  const {
    data: appointments,
    isLoading,
    isError,
    error,
  } = useQuery<Appointment[], Error>({
    queryKey: ['appointments', user?._id],
    queryFn: () => api.getAppointments(),
    enabled: !!user, // Only run the query if the user is loaded
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { appointments, isLoading, isError, error };
}; 