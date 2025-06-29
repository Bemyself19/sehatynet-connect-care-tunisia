import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, FileText, Monitor, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const RadiologistLayout = () => {
  const { t } = useTranslation();

  const sidebarItems = [
    { label: t('dashboard') || 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/radiologist' },
    { label: t('imagingReports') || 'Imaging Reports', icon: <FileText className="h-5 w-5" />, href: '/dashboard/radiologist/reports' },
    { label: t('imagingStudies') || 'Imaging Studies', icon: <Monitor className="h-5 w-5" />, href: '/dashboard/radiologist/studies' },
    { label: t('profile') || 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/radiologist/profile' },
  ];

  return (
    <Layout sidebarItems={sidebarItems}>
      <Outlet />
    </Layout>
  );
};

export default RadiologistLayout; 