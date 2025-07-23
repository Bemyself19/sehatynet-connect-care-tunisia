import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from '@/components/ui/layout';
import { Activity, FileText, ShoppingCart, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PharmacyLayout = () => {
  const { t } = useTranslation();

  const sidebarItems = [
    { label: t('pharmacyDashboard') || 'Tableau de Bord', icon: <Activity className="h-5 w-5" />, href: '/dashboard/pharmacy' },
    { label: t('prescriptions') || 'Ordonnances', icon: <FileText className="h-5 w-5" />, href: '/dashboard/pharmacy/prescriptions' },
    { label: t('inventory') || 'Inventaire', icon: <ShoppingCart className="h-5 w-5" />, href: '/dashboard/pharmacy/inventory' },
    { label: t('profile') || 'Profil', icon: <UserIcon className="h-5 w-5" />, href: '/dashboard/pharmacy/profile' },
  ];

  return (
    <Layout sidebarItems={sidebarItems}>
      <Outlet />
    </Layout>
  );
};

export default PharmacyLayout; 