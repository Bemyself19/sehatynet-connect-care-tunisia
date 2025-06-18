
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, FileText, Settings, Heart } from 'lucide-react';

const ProviderDashboard: React.FC = () => {
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
              <span className="text-sm text-gray-600">{t('welcome') || 'Welcome'}, Dr. Provider</span>
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
            {t('providerDashboard') || 'Provider Dashboard'}
          </h1>
          <p className="text-gray-600">
            {t('managePatients') || 'Manage your patients and appointments'}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">24</CardTitle>
              <CardDescription>{t('todayAppointments') || "Today's Appointments"}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">156</CardTitle>
              <CardDescription>{t('totalPatients') || 'Total Patients'}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">89%</CardTitle>
              <CardDescription>{t('satisfactionRate') || 'Satisfaction Rate'}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl font-bold">$2,450</CardTitle>
              <CardDescription>{t('monthlyEarnings') || 'Monthly Earnings'}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{t('schedule') || 'My Schedule'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('manageSchedule') || 'Manage your availability'}
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
                <CardTitle className="text-lg">{t('consultations') || 'Consultations'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                {t('viewConsultations') || 'View consultation history'}
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

        {/* Today's Schedule */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('todaySchedule') || "Today's Schedule"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Ahmed Hassan</p>
                    <p className="text-sm text-gray-600">General Consultation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">9:00 AM</p>
                    <Button size="sm" variant="outline">Join</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Maria Gonzalez</p>
                    <p className="text-sm text-gray-600">Follow-up</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">10:30 AM</p>
                    <Button size="sm" variant="outline">Join</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-gray-600">Consultation</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">2:00 PM</p>
                    <Button size="sm">Start</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('recentPatients') || 'Recent Patients'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-gray-600">Last visit: Yesterday</p>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Mohamed Ali</p>
                    <p className="text-sm text-gray-600">Last visit: 3 days ago</p>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Emma Wilson</p>
                    <p className="text-sm text-gray-600">Last visit: 1 week ago</p>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProviderDashboard;
