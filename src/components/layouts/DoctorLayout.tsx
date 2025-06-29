import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, Calendar, Users, FileText, MessageSquare, User as UserIcon, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DoctorLayout = () => {
  const { t } = useTranslation();

  const sidebarItems = [
    { label: t('dashboard') || 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/doctor' },
    { label: t('appointments') || 'Appointments', icon: <Calendar className="h-5 w-5" />, href: '/dashboard/doctor/appointments' },
    { label: t('patients') || 'Patients', icon: <Users className="h-5 w-5" />, href: '/dashboard/doctor/patients' },
    { label: t('teleExpertise') || 'Tele-Expertise', icon: <MessageSquare className="h-5 w-5" />, href: '/dashboard/doctor/tele-expertise' },
    { label: t('analytics') || 'Analytics', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/doctor/analytics' },
    { label: t('profile') || 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/doctor/profile' },
  ];

  return (
    <Layout sidebarItems={sidebarItems}>
      <Outlet />
    </Layout>
  );
};

export default DoctorLayout; 