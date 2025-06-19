
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import AuthLayout from '@/components/auth/AuthLayout';
import { Shield, Heart } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    adminCode: ''
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
      console.log('Admin login attempt:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock admin validation - Admin code is ADMIN2024
      if (formData.adminCode !== 'ADMIN2024') {
        throw new Error('Invalid admin code');
      }
      
      // Store admin auth
      localStorage.setItem('authToken', 'admin-token-' + Date.now());
      localStorage.setItem('userRole', 'admin');
      
      toast({
        title: t('loginSuccess') || 'Login successful',
        description: t('adminWelcome') || 'Welcome to admin panel!',
      });

      navigate('/dashboard/admin');
    } catch (error) {
      toast({
        title: t('loginError') || 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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
          <AuthLayout 
            title={t('adminLogin') || 'Admin Login'} 
            subtitle={t('adminLoginSubtitle') || 'Secure administrator access'}
          >
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            
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
                  placeholder={t('enterAdminEmail') || 'Enter admin email'}
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

              <div>
                <Label htmlFor="adminCode">{t('adminCode') || 'Admin Code'}</Label>
                <Input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  required
                  value={formData.adminCode}
                  onChange={handleChange}
                  placeholder="Enter ADMIN2024"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Admin code: ADMIN2024</p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (t('signingIn') || 'Signing in...') : (t('adminSignIn') || 'Admin Sign In')}
              </Button>

              <div className="text-center">
                <Link to="/auth/login-selection" className="text-sm text-blue-600 hover:text-blue-500">
                  {t('backToLogin') || 'Back to login selection'}
                </Link>
              </div>
            </form>
          </AuthLayout>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
