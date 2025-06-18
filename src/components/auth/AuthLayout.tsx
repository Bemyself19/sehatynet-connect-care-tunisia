
import React from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { currentLanguage } = useLanguage();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Heart className="h-12 w-12 text-blue-600 mr-2" />
            <span className="text-3xl font-bold text-gray-900">SehatyNet+</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
