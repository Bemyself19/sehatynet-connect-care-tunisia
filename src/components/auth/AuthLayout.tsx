import React from 'react';
import { Heart } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import Logo from '@/components/ui/logo';

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
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
