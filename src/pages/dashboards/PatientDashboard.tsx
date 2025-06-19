import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, FileText, Heart, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import AppointmentsList from '@/components/patient/AppointmentsList';
import MedicalRecords from '@/components/patient/MedicalRecords';
import PaymentForm from '@/components/payment/PaymentForm';
import { useState } from 'react';

const PatientDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [showPayment, setShowPayment] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/auth/login';
  };

  if (activeView === 'appointments') {
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
                <Button variant="outline" size="sm" onClick={() => setActiveView('overview')}>
                  {t('backToDashboard') || 'Back to Dashboard'}
                </Button>
                <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Patient</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  {t('logout') || 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AppointmentsList />
        </main>
      </div>
    );
  }

  if (activeView === 'medical-records') {
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
                <Button variant="outline" size="sm" onClick={() => setActiveView('overview')}>
                  {t('backToDashboard') || 'Back to Dashboard'}
                </Button>
                <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Patient</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  {t('logout') || 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MedicalRecords />
        </main>
      </div>
    );
  }

  if (showPayment) {
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
                <Button variant="outline" size="sm" onClick={() => setShowPayment(false)}>
                  {t('backToDashboard') || 'Back to Dashboard'}
                </Button>
                <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Patient</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  {t('logout') || 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PaymentForm 
            amount={150} 
            description="Consultation Fee"
            onSuccess={() => setShowPayment(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-2" />
              <span className="text-2xl font-bold text-gray-900">SehatyNet+</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Patient</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {t('logout') || 'Logout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('patientDashboard') || 'Patient Dashboard'}
          </h1>
          <p className="text-gray-600">
            {t('dashboardSubtitle') || 'Manage your health and appointments'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Link to="/appointments/book">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{t('bookAppointment') || 'Book Appointment'}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('scheduleConsultation') || 'Schedule a new consultation'}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('appointments')}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">{t('appointments') || 'My Appointments'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('viewAppointments') || 'View upcoming appointments'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('medical-records')}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">{t('medicalRecords') || 'Medical Records'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('accessRecords') || 'Access your medical history'}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowPayment(true)}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">{t('payments') || 'Payments'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('managePayments') || 'Manage payments and billing'}
              </CardDescription>
            </CardContent>
          </Card>

          <Link to="/profile">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg">{t('profile') || 'My Profile'}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {t('updateProfile') || 'Update your information'}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AppointmentsList />

          <MedicalRecords />
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
