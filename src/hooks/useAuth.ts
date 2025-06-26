import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';
import { LoginCredentials, User } from '@/types/user';
import { useUser } from '@/hooks/useUser';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refetchAfterLogin } = useUser();

  const { mutate: login, isPending: isLoggingIn } = useMutation({
    mutationFn: (credentials: LoginCredentials) => api.login(credentials),
    onSuccess: async (data) => {
      // 1. CRITICAL: Clear all data from previous sessions for this tab.
      queryClient.clear();

      // 2. Store the new user's authentication token in tab-specific session storage.
      sessionStorage.setItem('authToken', data.token);

      // 3. Immediately place the new user's data into the now-empty cache.
      // This key MUST match the key used in the useUser hook.
      queryClient.setQueryData(['userProfile'], data.user);
      
      toast.success('Login successful! Welcome back.');
      
      // 4. Refetch the latest user profile from /users/me before navigating
      await refetchAfterLogin();
      const dashboardPath = `/dashboard/${data.user.role}`;
      navigate(dashboardPath);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    },
  });

  const logout = () => {
    // 1. Remove user-specific data from storage.
    sessionStorage.removeItem('authToken');

    // 2. Clear the entire application cache to prevent stale data.
    queryClient.clear();

    // 3. Redirect to the main login selection screen.
    navigate('/auth/login-selection');
    toast.info("You have been logged out.");
  };

  return { login, isLoggingIn, logout };
}; 