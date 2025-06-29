import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { BarChart3, Users, Settings, FileText, User, Shield } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useTranslation } from 'react-i18next';

const AdminLayout = () => {
  const { user } = useUser();
  const { t } = useTranslation();

  const sidebarItems = [
    { label: t('dashboard') || 'Dashboard', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/admin' },
    { label: t('userManagement') || 'User Management', icon: <Users className="h-5 w-5" />, href: '/dashboard/admin/users' },
    { label: t('systemSettings') || 'System Settings', icon: <Settings className="h-5 w-5" />, href: '/dashboard/admin/settings' },
    { label: t('auditLogs') || 'Audit Logs', icon: <FileText className="h-5 w-5" />, href: '/dashboard/admin/audit-logs' },
    { label: t('reportsAnalytics') || 'Reports', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/admin/reports' },
    { label: t('profile') || 'Profile', icon: <User className="h-5 w-5" />, href: '/dashboard/admin/profile' },
  ];

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
    >
      <Outlet />
    </DashboardLayout>
  );
};

export default AdminLayout; 