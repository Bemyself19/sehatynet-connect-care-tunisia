import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/components/auth/AuthLayout';
import { LoginForm, UserRole } from '@/types/user';
import { Heart } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [searchParams] = useSearchParams();
  const userTypeFromUrl = searchParams.get('type') || 'patient';
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const { t, i18n } = useTranslation();
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userTypeFromUrl !== 'provider') {
      setSelectedRole(userTypeFromUrl as UserRole);
    } else {
      setSelectedRole(''); // Reset when switching to provider
    }
  }, [userTypeFromUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value as UserRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userTypeFromUrl === 'provider' && !selectedRole) {
      toast.error(t('selectProviderRole') || 'Please select your specific provider role.');
      return;
    }

    const roleToSubmit = userTypeFromUrl === 'provider' ? selectedRole : (userTypeFromUrl as UserRole);

    if (!roleToSubmit) {
       toast.error(t('couldNotDetermineRole') || 'Could not determine user role. Please go back and select a login type.');
       return;
    }
    
    login({ ...formData, role: roleToSubmit });
  };

  const getTitle = () => {
    if (userTypeFromUrl === 'patient') return t('patientLogin') || 'Patient Login';
    if (userTypeFromUrl === 'provider') return t('providerLogin') || 'Provider Login';
    return t('login') || 'Sign In';
  };

  const getSubtitle = () => {
    if (userTypeFromUrl === 'patient') return t('patientLoginSubtitle') || 'Access your health information';
    if (userTypeFromUrl === 'provider') return t('providerLoginSubtitle') || 'Manage your practice';
    return t('loginSubtitle') || 'Access your SehatyNet+ account';
  };

  const SehatyLogo = () => (
    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md mb-4">
      <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 58s-1.7-1.5-4.2-3.6C15.2 43.2 6 34.7 6 24.5 6 15.6 13.6 8 22.5 8c4.5 0 8.7 2.1 11.5 5.5C36.8 10.1 41 8 45.5 8 54.4 8 62 15.6 62 24.5c0 10.2-9.2 18.7-21.8 29.9C33.7 56.5 32 58 32 58z" fill="#2563eb"/>
        <circle cx="18" cy="14" r="5" fill="#22c55e" stroke="#fff" strokeWidth="2"/>
      </svg>
    </span>
  );

  return (
    <AuthLayout title={getTitle()}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center pb-2">
          <SehatyLogo />
          <span className="text-3xl font-bold text-gray-900 mb-1">SehatyNet+</span>
          <span className="text-lg text-gray-600 mb-2">{getTitle()}</span>
          <span className="text-gray-500 text-base mb-2">{getSubtitle()}</span>
        </div>
        {userTypeFromUrl === 'provider' && (
          <div>
            <Label htmlFor="role">{t('selectProviderRole') || 'Select Provider Role'}</Label>
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder={t('selectRole') || 'Select role'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">{t('doctor') || 'Doctor'}</SelectItem>
                <SelectItem value="pharmacy">{t('pharmacy') || 'Pharmacy'}</SelectItem>
                <SelectItem value="lab">{t('lab') || 'Lab'}</SelectItem>
                <SelectItem value="radiologist">{t('radiologist') || 'Radiologist'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="email">{t('email') || 'Email'}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">{t('password') || 'Password'}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={formData.password}
            onChange={handleChange}
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
        <Button type="submit" className="w-full" disabled={isLoggingIn}>
          {isLoggingIn ? t('loading') || 'Loading...' : t('login') || 'Login'}
        </Button>
        <div className="text-center">
          <span className="text-sm text-gray-600">
            {t('noAccount') || "Don't have an account?"}{' '}
            <Link to="/auth/register-selection" className="text-blue-600 hover:text-blue-500 font-medium">
              {t('signUp') || 'Sign up'}
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
