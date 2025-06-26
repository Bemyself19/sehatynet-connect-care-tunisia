import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { User } from '@/types/user';

export const useUser = () => {
  const queryClient = useQueryClient();
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<User, Error>({
    queryKey: ['userProfile'],
    queryFn: () => api.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure
  });

  // Helper to force refetch after login
  const refetchAfterLogin = async () => {
    await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    await refetch();
  };

  return { user, isLoading, isError, error, refetch, refetchAfterLogin };
}; 