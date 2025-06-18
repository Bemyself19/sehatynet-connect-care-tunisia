
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import AuthLayout from '@/components/auth/AuthLayout';
import { LoginCredentials, UserRole } from '@/types/user';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      console.log('Login attempt:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login - redirect based on role
      // In real implementation, get user role from API response
      const mockUserRole: UserRole = 'patient'; // This would come from API
      
      toast({
        title: t('loginSuccess') || 'Login successful',
        description: t('welcomeBack') || 'Welcome back!',
      });

      // Redirect to appropriate dashboard
      switch (mockUserRole) {
        case 'patient':
          navigate('/dashboard/patient');
          break;
        case 'admin':
          navigate('/dashboard/admin');
          break;
        default:
          navigate('/dashboard/provider');
      }
    } catch (error) {
      toast({
        title: t('loginError') || 'Login failed',
        description: t('invalidCredentials') || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={t('login') || 'Sign In'} 
      subtitle={t('loginSubtitle') || 'Access your SehatyNet+ account'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email">{t('email') || 'Email'}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder={t('enterEmail') || 'Enter your email'}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">{t('password') || 'Password'}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder={t('enterPassword') || 'Enter your password'}
            className="mt-1"
          />
        </div>

        <div className="flex items-center justify-between">
          <Link 
            to="/auth/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {t('forgotPassword') || 'Forgot password?'}
          </Link>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? (t('signingIn') || 'Signing in...') : (t('signIn') || 'Sign In')}
        </Button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            {t('noAccount') || "Don't have an account?"}{' '}
            <Link to="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
              {t('signUp') || 'Sign up'}
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
