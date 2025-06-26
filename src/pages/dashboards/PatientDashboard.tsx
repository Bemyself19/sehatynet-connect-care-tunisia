import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, MessageSquare, Plus, Activity, TrendingUp, Shield, User as UserIcon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AppointmentsList from '@/components/patient/AppointmentsList';
import MedicalRecords from '@/components/patient/MedicalRecords';
import { useUser } from '@/hooks/useUser';
import api from '@/lib/api';
import { MedicalProfileQAModal } from '@/components/patient/MedicalProfileQAModal';
import { toast } from 'sonner';
import { Layout } from '@/components/ui/layout';

const PatientDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<'overview' | 'appointments' | 'medical-records'>('overview');
  const { user, isLoading, refetch } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMedicalQAModal, setShowMedicalQAModal] = useState(false);

  // Helper to check if medical info is incomplete
  const isMedicalInfoIncomplete = user && user.role === 'patient' && (
    !(user as any).medicalHistory || (user as any).medicalHistory.length === 0 ||
    !(user as any).allergies || (user as any).allergies.length === 0 ||
    !(user as any).currentMedications || (user as any).currentMedications.length === 0
  );

  // Handler to save medical info
  const handleSaveMedicalInfo = async (data: { allergies: string[]; medications: string[]; conditions: string[] }) => {
    setShowMedicalQAModal(false);
    try {
      await api.updateProfile({
        allergies: data.allergies,
        currentMedications: data.medications,
        medicalHistory: data.conditions,
      });
      await refetch();
      toast.success('Medical profile updated!', { description: 'Your medical information has been saved.' });
    } catch (error) {
      toast.error('Failed to update medical profile', { description: 'Please try again later.' });
    }
  };

  useEffect(() => {
    if (
      user &&
      user.role === 'patient' &&
      !user.medicalInfoDismissed &&
      (
        !('medicalHistory' in user) || !user.medicalHistory || user.medicalHistory.length === 0 ||
        !('allergies' in user) || !user.allergies || user.allergies.length === 0 ||
        !('currentMedications' in user) || !user.currentMedications || user.currentMedications.length === 0
      )
    ) {
      setShowMedicalQAModal(true);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  // Sidebar navigation items
  const sidebarItems = [
    { label: 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/patient' },
    { label: 'Book Appointment', icon: <Plus className="h-5 w-5" />, href: '/appointments/book' },
    { label: 'My Appointments', icon: <Calendar className="h-5 w-5" />, href: '/dashboard/patient/appointments', badge: 3 },
    { label: 'Medical Records', icon: <FileText className="h-5 w-5" />, href: '/dashboard/patient/medical-records' },
    { label: 'Tele-Expertise', icon: <MessageSquare className="h-5 w-5" />, href: '/dashboard/patient/tele-expertise' },
    { label: 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/patient/profile' },
  ];

  return (
    <Layout
      title="Patient Dashboard"
      subtitle="Welcome back! Here's your health overview and quick actions"
      sidebarItems={sidebarItems}
    >
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-10 mt-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Dashboard</h1>
        <p className="text-lg text-gray-600 mb-8">Welcome back! Here's your health overview and quick actions</p>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-blue-600">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-blue-900">3</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-green-600">Active Prescriptions</p>
                <p className="text-2xl font-bold text-green-900">5</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-purple-600">Medical Records</p>
                <p className="text-2xl font-bold text-purple-900">12</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6 flex items-center gap-4">
              <div>
                <p className="text-sm font-medium text-orange-600">Health Score</p>
                <p className="text-2xl font-bold text-orange-900">85%</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link to="/appointments/book">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-blue-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Plus className="h-6 w-6 text-blue-500 group-hover:text-blue-700" />
                    <span className="text-lg font-semibold text-blue-900 group-hover:text-blue-700">Book Appointment</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Schedule a new consultation</p>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/dashboard/patient/appointments">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-green-500 group-hover:text-green-700" />
                    <span className="text-lg font-semibold text-green-900 group-hover:text-green-700">My Appointments</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">View upcoming appointments</p>
                </CardHeader>
              </Card>
            </Link>
            <Link to="/dashboard/patient/medical-records">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-transparent hover:border-purple-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-purple-500 group-hover:text-purple-700" />
                    <span className="text-lg font-semibold text-purple-900 group-hover:text-purple-700">Medical Records</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Access health records</p>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
        {/* Medical Info Modal */}
        <MedicalProfileQAModal
          open={showMedicalQAModal}
          onClose={() => setShowMedicalQAModal(false)}
          onSave={handleSaveMedicalInfo}
        />
      </div>
    </Layout>
  );
};

export default PatientDashboard;
