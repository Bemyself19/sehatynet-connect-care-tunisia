import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, FileText, Monitor, User as UserIcon } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/radiologist' },
  { label: 'Imaging Reports', icon: <FileText className="h-5 w-5" />, href: '/dashboard/radiologist/reports' },
  { label: 'Imaging Studies', icon: <Monitor className="h-5 w-5" />, href: '/dashboard/radiologist/studies' },
  { label: 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/radiologist/profile' },
];

const RadiologistLayout = () => (
  <Layout sidebarItems={sidebarItems}>
    <Outlet />
  </Layout>
);

export default RadiologistLayout; 