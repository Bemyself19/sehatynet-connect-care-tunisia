import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { BarChart3, Users, Settings, FileText, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


const AdminDashboard: React.FC = () => {
  const { user } = useUser();
  const { t } = useTranslation();
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('totalUsers') || 'Total Users'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">--</div>
            <div className="text-gray-500 text-sm">{t('allRoles') || 'All roles'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('activeProviders') || 'Active Providers'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">--</div>
            <div className="text-gray-500 text-sm">{t('providersList') || 'Doctors, Labs, Pharmacies, Radiologists'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('pendingApprovals') || 'Pending Approvals'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">--</div>
            <div className="text-gray-500 text-sm">{t('newSignups') || 'New signups'}</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('quickLinks') || 'Quick Links'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><Link to="/dashboard/admin/users" className="text-blue-600 hover:underline">{t('manageUsers') || 'Manage Users'}</Link></li>
              <li><Link to="/dashboard/admin/settings" className="text-blue-600 hover:underline">{t('systemSettings') || 'System Settings'}</Link></li>
              <li><Link to="/dashboard/admin/audit-logs" className="text-blue-600 hover:underline">{t('viewAuditLogs') || 'View Audit Logs'}</Link></li>
              <li><Link to="/dashboard/admin/reports" className="text-blue-600 hover:underline">{t('reportsAnalytics') || 'Reports & Analytics'}</Link></li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('profile') || 'Profile'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                <div className="text-gray-500 text-sm">{user?.email}</div>
                <Link to="/dashboard/admin/profile" className="text-blue-600 hover:underline text-sm">{t('editProfile') || 'Edit Profile'}</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard;

