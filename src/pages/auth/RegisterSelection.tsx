import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { User, Stethoscope } from 'lucide-react';
import { BrandLogo } from '@/components/ui/logo';

const RegisterSelection: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Card className="w-full max-w-xl shadow-xl border-0">
        <CardHeader className="flex flex-col items-center pb-2">
          <BrandLogo size={48} className="mb-4" />
          <CardDescription className="text-lg text-gray-600 mb-2">
            {t('selectRegistrationType') || 'Select Registration Type'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link to="/auth/register?type=patient" className="group">
              <div className="flex flex-col items-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm group-hover:shadow-lg cursor-pointer">
                <span className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                  <User className="h-8 w-8 text-blue-600" />
                </span>
                <span className="font-semibold text-blue-700 text-lg mb-1">{t('patient') || 'Patient'}</span>
                <span className="text-gray-500 text-sm mb-3 text-center">{t('patientRegisterDesc') || 'Register as a patient to access healthcare services.'}</span>
              </div>
            </Link>
            <Link to="/auth/register?type=provider" className="group">
              <div className="flex flex-col items-center p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors shadow-sm group-hover:shadow-lg cursor-pointer">
                <span className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 mb-3">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                </span>
                <span className="font-semibold text-green-700 text-lg mb-1">{t('provider') || 'Healthcare Provider'}</span>
                <span className="text-gray-500 text-sm mb-3 text-center">{t('providerRegisterDesc') || 'Register as a healthcare provider to offer services.'}</span>
              </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterSelection;
