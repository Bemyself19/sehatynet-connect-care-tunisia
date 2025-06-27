import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, FileText, ShoppingCart, User as UserIcon } from 'lucide-react';

const sidebarItems = [
  { label: 'Dashboard', icon: <Activity className="h-5 w-5" />, href: '/dashboard/pharmacy' },
  { label: 'Prescriptions', icon: <FileText className="h-5 w-5" />, href: '/dashboard/pharmacy/prescriptions' },
  { label: 'Inventory', icon: <ShoppingCart className="h-5 w-5" />, href: '/dashboard/pharmacy/inventory' },
  { label: 'Profile', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/pharmacy/profile' },
];

const PharmacyLayout = () => (
  <Layout sidebarItems={sidebarItems}>
    <Outlet />
  </Layout>
);

export default PharmacyLayout; 