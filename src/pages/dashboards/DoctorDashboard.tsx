
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, Settings, Heart, Stethoscope } from 'lucide-react';

const DoctorDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();

  const handleLogout = () => {
    // Clear any stored auth data
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
              <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Dr. Smith</span>
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
            {t('doctorDashboard') || 'Doctor Dashboard'}
          </h1>
          <p className="text-gray-600">
            {t('managePatients') || 'Manage your patients and consultations'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">12</CardTitle>
              <CardDescription>{t('todayAppointments') || "Today's Appointments"}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">45</CardTitle>
              <CardDescription>{t('totalPatients') || 'Total Patients'}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">98%</CardTitle>
              <CardDescription>{t('satisfactionRate') || 'Satisfaction Rate'}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">$1,200</CardTitle>
              <CardDescription>{t('monthlyEarnings') || 'Monthly Earnings'}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{t('consultations') || 'Consultations'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('manageConsultations') || 'Manage patient consultations'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">{t('patients') || 'Patients'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('viewPatients') || 'View and manage patients'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">{t('prescriptions') || 'Prescriptions'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('managePrescriptions') || 'Write and manage prescriptions'}
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
                {t('profileSettings') || 'Profile and preferences'}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
