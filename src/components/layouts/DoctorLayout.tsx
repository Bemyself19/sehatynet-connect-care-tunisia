import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, Calendar, Users, FileText, MessageSquare, User as UserIcon, BarChart3 } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/doctor' },
  { label: 'Appointments', icon: <Calendar className="h-5 w-5" />, href: '/dashboard/doctor/appointments' },
  { label: 'Patients', icon: <Users className="h-5 w-5" />, href: '/dashboard/doctor/patients' },
  { label: 'Tele-Expertise', icon: <MessageSquare className="h-5 w-5" />, href: '/dashboard/doctor/tele-expertise' },
  { label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/doctor/analytics' },
  { label: 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/doctor/profile' },
];

const DoctorLayout = () => (
  <Layout sidebarItems={sidebarItems}>
    <Outlet />
  </Layout>
);

export default DoctorLayout; 