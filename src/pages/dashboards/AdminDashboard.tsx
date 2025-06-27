import React from 'react';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useUser } from '@/hooks/useUser';
import { BarChart3, Users, Settings, FileText, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const sidebarItems = [
  { label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/admin' },
  { label: 'User Management', icon: <Users className="h-5 w-5" />, href: '/dashboard/admin/users' },
  { label: 'System Settings', icon: <Settings className="h-5 w-5" />, href: '/dashboard/admin/settings' },
  { label: 'Audit Logs', icon: <FileText className="h-5 w-5" />, href: '/dashboard/admin/audit-logs' },
  { label: 'Reports', icon: <BarChart3 className="h-5 w-5" />, href: '/dashboard/admin/reports' },
  { label: 'Profile', icon: <User className="h-5 w-5" />, href: '/dashboard/admin/profile' },
];

const AdminDashboard: React.FC = () => {
  const { user } = useUser();
  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="System overview and quick actions"
      user={user}
      sidebarItems={sidebarItems}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">--</div>
            <div className="text-gray-500 text-sm">All roles</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">--</div>
            <div className="text-gray-500 text-sm">Doctors, Labs, Pharmacies, Radiologists</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">--</div>
            <div className="text-gray-500 text-sm">New signups</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li><Link to="/dashboard/admin/users" className="text-blue-600 hover:underline">Manage Users</Link></li>
              <li><Link to="/dashboard/admin/settings" className="text-blue-600 hover:underline">System Settings</Link></li>
              <li><Link to="/dashboard/admin/audit-logs" className="text-blue-600 hover:underline">View Audit Logs</Link></li>
              <li><Link to="/dashboard/admin/reports" className="text-blue-600 hover:underline">Reports & Analytics</Link></li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
                <div className="text-gray-500 text-sm">{user?.email}</div>
                <Link to="/dashboard/admin/profile" className="text-blue-600 hover:underline text-sm">Edit Profile</Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

