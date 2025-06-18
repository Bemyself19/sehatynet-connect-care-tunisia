
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Globe, Heart, Shield, Clock } from 'lucide-react';

const Index = () => {
  const { t, currentLanguage, setLanguage } = useLanguage();

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-green-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </div>
            
            {/* Language Switcher */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-600" />
                <select 
                  value={currentLanguage} 
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <Link to="/auth/login">
                  <Button variant="outline">{t('login')}</Button>
                </Link>
                <Link to="/auth/register">
                  <Button>{t('register')}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('heroTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register?role=patient">
              <Button size="lg" className="w-full sm:w-auto">
                {t('registerAsPatient')}
              </Button>
            </Link>
            <Link to="/auth/register?role=provider">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {t('registerAsProvider')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('secureTitle')}</h3>
            <p className="text-gray-600">{t('secureDescription')}</p>
          </div>
          
          <div className="text-center p-6">
            <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('availableTitle')}</h3>
            <p className="text-gray-600">{t('availableDescription')}</p>
          </div>
          
          <div className="text-center p-6">
            <Heart className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('comprehensiveTitle')}</h3>
            <p className="text-gray-600">{t('comprehensiveDescription')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
