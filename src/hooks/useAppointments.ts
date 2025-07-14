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
    staleTime: 30 * 1000, // 30 seconds - refresh more frequently for real-time updates
  });

  return { appointments, isLoading, isError, error };
}; 