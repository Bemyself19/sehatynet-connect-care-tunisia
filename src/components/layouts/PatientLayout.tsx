import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Calendar, FileText, MessageSquare, Plus, Activity, Shield, User as UserIcon } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';

const PatientLayout = () => {
  const { appointments, isLoading } = useAppointments();
  // Calculate upcoming appointments (not cancelled, date today or in future)
  const upcomingAppointmentsCount = (appointments || []).filter(apt => {
    if (apt.status === 'cancelled') return false;
    const today = new Date();
    const aptDate = new Date(apt.scheduledDate);
    return aptDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }).length;

  const badge = isLoading ? '...' : (upcomingAppointmentsCount > 0 ? upcomingAppointmentsCount : undefined);

  const sidebarItems = [
    { label: 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/patient' },
    { label: 'Book Appointment', icon: <Plus className="h-5 w-5" />, href: '/dashboard/patient/book' },
    { label: 'My Appointments', icon: <Calendar className="h-5 w-5" />, href: '/dashboard/patient/appointments', badge },
    { label: 'Medical Records', icon: <FileText className="h-5 w-5" />, href: '/dashboard/patient/medical-records' },
    { label: 'Tele-Expertise', icon: <MessageSquare className="h-5 w-5" />, href: '/dashboard/patient/tele-expertise' },
    { label: 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/patient/profile' },
  ];

  return (
    <Layout sidebarItems={sidebarItems}>
      <Outlet />
    </Layout>
  );
};

export default PatientLayout; 