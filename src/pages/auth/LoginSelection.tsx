import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { User, Stethoscope, Shield } from 'lucide-react';

const SehatyLogo = () => (
  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-md mb-4">
    <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 58s-1.7-1.5-4.2-3.6C15.2 43.2 6 34.7 6 24.5 6 15.6 13.6 8 22.5 8c4.5 0 8.7 2.1 11.5 5.5C36.8 10.1 41 8 45.5 8 54.4 8 62 15.6 62 24.5c0 10.2-9.2 18.7-21.8 29.9C33.7 56.5 32 58 32 58z" fill="#2563eb"/>
      <circle cx="18" cy="14" r="5" fill="#22c55e" stroke="#fff" strokeWidth="2"/>
    </svg>
  </span>
);

const LoginSelection: React.FC = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Card className="w-full max-w-2xl shadow-xl border-0">
        <CardHeader className="flex flex-col items-center pb-2">
          <SehatyLogo />
          <CardTitle className="text-3xl font-bold text-gray-900 mb-1">SehatyNet+</CardTitle>
          <CardDescription className="text-lg text-gray-600 mb-2">
            {t('selectLoginType') || 'Select Account Type'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/auth/login?type=patient" className="group">
              <div className="flex flex-col items-center p-6 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm group-hover:shadow-lg cursor-pointer">
                <span className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                  <User className="h-8 w-8 text-blue-600" />
                </span>
                <span className="font-semibold text-blue-700 text-lg mb-1">{t('patient') || 'Patient'}</span>
                <span className="text-gray-500 text-sm mb-3 text-center">{t('patientLoginDesc') || 'Access your health records and appointments.'}</span>
                <Button className="w-full" variant="secondary">{t('loginAsPatient') || 'Sign in as Patient'}</Button>
              </div>
            </Link>
            <Link to="/auth/login?type=provider" className="group">
              <div className="flex flex-col items-center p-6 rounded-xl bg-green-50 hover:bg-green-100 transition-colors shadow-sm group-hover:shadow-lg cursor-pointer">
                <span className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 mb-3">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                </span>
                <span className="font-semibold text-green-700 text-lg mb-1">{t('provider') || 'Provider'}</span>
                <span className="text-gray-500 text-sm mb-3 text-center">{t('providerLoginDesc') || 'Manage patients and appointments.'}</span>
                <Button className="w-full" variant="secondary">{t('loginAsProvider') || 'Sign in as Provider'}</Button>
              </div>
            </Link>
            <Link to="/auth/admin-login" className="group">
              <div className="flex flex-col items-center p-6 rounded-xl bg-red-50 hover:bg-red-100 transition-colors shadow-sm group-hover:shadow-lg cursor-pointer">
                <span className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 mb-3">
                  <Shield className="h-8 w-8 text-red-600" />
                </span>
                <span className="font-semibold text-red-700 text-lg mb-1">{t('admin') || 'Admin'}</span>
                <span className="text-gray-500 text-sm mb-3 text-center">{t('adminLoginDesc') || 'System administration and management.'}</span>
                <Button className="w-full" variant="secondary">{t('loginAsAdmin') || 'Sign in as Admin'}</Button>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSelection;
