import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { BarChart3, Users, Settings, FileText, User, Shield } from 'lucide-react';
import { useUser } from '@/hooks/useUser';

const sidebarItems = [
  { label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/admin' },
  { label: 'User Management', icon: <Users className="h-5 w-5" />, href: '/dashboard/admin/users' },
  { label: 'System Settings', icon: <Settings className="h-5 w-5" />, href: '/dashboard/admin/settings' },
  { label: 'Audit Logs', icon: <FileText className="h-5 w-5" />, href: '/dashboard/admin/audit-logs' },
  { label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/admin/reports' },
  { label: 'Profile', icon: <User className="h-5 w-5" />, href: '/dashboard/admin/profile' },
];

const AdminLayout = () => {
  const { user } = useUser();

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