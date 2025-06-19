
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, FileText, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const PatientDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();

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
              <Button variant="outline" size="sm">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
          <Card>
            <CardHeader>
              <CardTitle>{t('upcomingAppointments') || 'Upcoming Appointments'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Dr. Sarah Johnson</p>
                    <p className="text-sm text-gray-600">General Consultation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Tomorrow</p>
                    <p className="text-sm text-gray-600">10:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Central Lab</p>
                    <p className="text-sm text-gray-600">Blood Test</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Friday</p>
                    <p className="text-sm text-gray-600">9:00 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('recentActivity') || 'Recent Activity'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm">Appointment with Dr. Smith completed</p>
                    <p className="text-xs text-gray-600">2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="text-sm">Lab results received</p>
                    <p className="text-xs text-gray-600">1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  <div>
                    <p className="text-sm">Prescription filled at City Pharmacy</p>
                    <p className="text-xs text-gray-600">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
