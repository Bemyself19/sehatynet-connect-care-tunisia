import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, FileText, TestTube, User as UserIcon } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/lab' },
  { label: 'Test Results', icon: <FileText className="h-5 w-5" />, href: '/dashboard/lab/results' },
  { label: 'Test Catalog', icon: <TestTube className="h-5 w-5" />, href: '/dashboard/lab/catalog' },
  { label: 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/lab/profile' },
];

const LabLayout = () => (
  <Layout sidebarItems={sidebarItems}>
    <Outlet />
  </Layout>
);

export default LabLayout; 