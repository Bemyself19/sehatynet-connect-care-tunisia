import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, FileText, TestTube, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LabLayout = () => {
  const { t } = useTranslation();

  const sidebarItems = [
    { label: t('dashboard') || 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/lab' },
    { label: t('testResults') || 'Test Results', icon: <FileText className="h-5 w-5" />, href: '/dashboard/lab/results' },
    { label: t('testCatalog') || 'Test Catalog', icon: <TestTube className="h-5 w-5" />, href: '/dashboard/lab/catalog' },
    { label: t('profile') || 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/lab/profile' },
  ];

  return (
    <Layout sidebarItems={sidebarItems}>
      <Outlet />
    </Layout>
  );
};

export default LabLayout; 