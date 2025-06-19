
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import AuthLayout from '@/components/auth/AuthLayout';
import { LoginCredentials, UserRole } from '@/types/user';
import { Heart } from 'lucide-react';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'patient';
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
      console.log('Login attempt:', formData, 'User type:', userType);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store auth data
      localStorage.setItem('authToken', `${userType}-token-` + Date.now());
      localStorage.setItem('userRole', userType);
      
      toast({
        title: t('loginSuccess') || 'Login successful',
        description: t('welcomeBack') || 'Welcome back!',
      });

      // Redirect to appropriate dashboard based on user type
      if (userType === 'patient') {
        navigate('/dashboard/patient');
      } else if (userType === 'provider') {
        // For provider, we'll default to doctor dashboard
        navigate('/dashboard/doctor');
      } else {
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

  const getTitle = () => {
    if (userType === 'patient') return t('patientLogin') || 'Patient Login';
    if (userType === 'provider') return t('providerLogin') || 'Provider Login';
    return t('login') || 'Sign In';
  };

  const getSubtitle = () => {
    if (userType === 'patient') return t('patientLoginSubtitle') || 'Access your health information';
    if (userType === 'provider') return t('providerLoginSubtitle') || 'Manage your practice';
    return t('loginSubtitle') || 'Access your SehatyNet+ account';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-16">
        <div className="w-full max-w-md">
          <AuthLayout title={getTitle()} subtitle={getSubtitle()}>
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
                <Link to="/auth/login-selection" className="text-sm text-blue-600 hover:text-blue-500">
                  {t('changeAccountType') || 'Change account type'}
                </Link>
                <Link to="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                  {t('forgotPassword') || 'Forgot password?'}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
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
        </div>
      </div>
    </div>
  );
};

export default Login;
