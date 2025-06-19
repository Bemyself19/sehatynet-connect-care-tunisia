
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, User, Stethoscope, Shield } from 'lucide-react';

const LoginSelection: React.FC = () => {
  const { t, currentLanguage } = useLanguage();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-green-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('selectLoginType') || 'Select Login Type'}
          </h1>
          <p className="text-xl text-gray-600">
            {t('chooseAccountType') || 'Choose your account type to continue'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link to="/auth/login?type=patient">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{t('patient') || 'Patient'}</CardTitle>
                <CardDescription>
                  {t('patientLoginDesc') || 'Access your health records and appointments'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  {t('loginAsPatient') || 'Login as Patient'}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/auth/login?type=provider">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">{t('provider') || 'Provider'}</CardTitle>
                <CardDescription>
                  {t('providerLoginDesc') || 'Manage patients and appointments'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  {t('loginAsProvider') || 'Login as Provider'}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/auth/admin-login">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-xl">{t('admin') || 'Admin'}</CardTitle>
                <CardDescription>
                  {t('adminLoginDesc') || 'System administration and management'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  {t('loginAsAdmin') || 'Login as Admin'}
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LoginSelection;
