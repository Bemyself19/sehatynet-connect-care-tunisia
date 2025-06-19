
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube, FileText, Calendar, Settings, Heart, Activity } from 'lucide-react';

const LabDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/auth/login';
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Central Lab</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('logout') || 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('labDashboard') || 'Laboratory Dashboard'}
          </h1>
          <p className="text-gray-600">
            {t('manageTests') || 'Manage tests and results'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">18</CardTitle>
              <CardDescription>{t('pendingTests') || 'Pending Tests'}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">145</CardTitle>
              <CardDescription>{t('completedToday') || 'Completed Today'}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">8</CardTitle>
              <CardDescription>{t('urgentTests') || 'Urgent Tests'}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">$2,850</CardTitle>
              <CardDescription>{t('monthlyRevenue') || 'Monthly Revenue'}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <TestTube className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{t('tests') || 'Tests'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('manageTests') || 'Manage laboratory tests'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">{t('results') || 'Results'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('manageResults') || 'Upload and manage results'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">{t('appointments') || 'Appointments'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('scheduleTests') || 'Schedule test appointments'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">{t('settings') || 'Settings'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('labSettings') || 'Laboratory settings'}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LabDashboard;
