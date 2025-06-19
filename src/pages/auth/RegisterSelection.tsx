
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/hooks/useLanguage';
import { Heart, User, Stethoscope } from 'lucide-react';

const RegisterSelection: React.FC = () => {
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
            {t('selectRegistrationType') || 'Select Registration Type'}
          </h1>
          <p className="text-xl text-gray-600">
            {t('chooseAccountType') || 'Choose your account type to register'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <Link to="/auth/register?type=patient">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{t('patient') || 'Patient'}</CardTitle>
                <CardDescription>
                  {t('patientRegisterDesc') || 'Register as a patient to access healthcare services'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  {t('registerAsPatient') || 'Register as Patient'}
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/auth/register?type=provider">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">{t('provider') || 'Healthcare Provider'}</CardTitle>
                <CardDescription>
                  {t('providerRegisterDesc') || 'Register as a healthcare provider to offer services'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  {t('registerAsProvider') || 'Register as Provider'}
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center mt-8">
          <span className="text-sm text-gray-600">
            {t('alreadyHaveAccount') || 'Already have an account?'}{' '}
            <Link to="/auth/login-selection" className="text-blue-600 hover:text-blue-500 font-medium">
              {t('signIn') || 'Sign in'}
            </Link>
          </span>
        </div>
      </main>
    </div>
  );
};

export default RegisterSelection;
