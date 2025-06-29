import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Settings, FileText, BarChart3, Shield, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  
  // Mock data - replace with real API calls
  const stats = {
    totalUsers: 1247,
    activeProviders: 89,
    pendingApprovals: 12,
    systemHealth: 'Excellent',
    recentActivity: 156
  };

  const quickActions = [
    {
      title: t('userManagement') || 'User Management',
      description: t('manageUsersPermissions') || 'Manage users and permissions',
      icon: <Users className="h-8 w-8 text-blue-600" />,
      href: '/dashboard/admin/users',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: t('systemSettings') || 'System Settings',
      description: t('configureSystemParameters') || 'Configure system parameters',
      icon: <Settings className="h-8 w-8 text-green-600" />,
      href: '/dashboard/admin/settings',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: t('auditLogs') || 'Audit Logs',
      description: t('viewSystemActivityLogs') || 'View system activity logs',
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      href: '/dashboard/admin/audit-logs',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      title: t('reportsAnalytics') || 'Reports & Analytics',
      description: t('generateSystemReports') || 'Generate system reports',
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      href: '/dashboard/admin/reports',
      color: 'bg-purple-50 border-purple-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Shield Logo at the top */}
      <div className="flex items-center justify-start mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
          <Shield className="h-8 w-8 text-white" />
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalUsers') || 'Total Users'}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> {t('fromLastMonth') || 'from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeProviders') || 'Active Providers'}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProviders}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> {t('fromLastMonth') || 'from last month'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('pendingApprovals') || 'Pending Approvals'}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              {t('requiresAttention') || 'Requires attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('systemHealth') || 'System Health'}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">
              {t('allSystemsOperational') || 'All systems operational'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions') || 'Quick Actions'}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('accessFrequentAdminFunctions') || 'Access frequently used administrative functions'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className={`block p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md hover:scale-105 ${action.color}`}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  {action.icon}
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity') || 'Recent Activity'}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('latestSystemEvents') || 'Latest system events and user actions'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('newUserRegistration') || 'New user registration'}</p>
                <p className="text-xs text-gray-500">{t('drSarahJohnsonRegistered') || 'Dr. Sarah Johnson registered as a doctor'}</p>
              </div>
              <span className="text-xs text-gray-500">{t('2MinutesAgo') || '2 minutes ago'}</span>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('systemBackupCompleted') || 'System backup completed'}</p>
                <p className="text-xs text-gray-500">{t('dailyBackupCompleted') || 'Daily backup completed successfully'}</p>
              </div>
              <span className="text-xs text-gray-500">{t('1HourAgo') || '1 hour ago'}</span>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('providerApprovalPending') || 'Provider approval pending'}</p>
                <p className="text-xs text-gray-500">{t('labCorpRequiresApproval') || 'LabCorp Medical Center requires approval'}</p>
              </div>
              <span className="text-xs text-gray-500">{t('3HoursAgo') || '3 hours ago'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard; 