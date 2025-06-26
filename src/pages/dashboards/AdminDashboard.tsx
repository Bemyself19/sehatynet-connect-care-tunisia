import React, { useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Heart, Shield, Activity, BarChart3, Settings, UserPlus, FileText, AlertTriangle } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import { useUser } from '@/hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/ui/dashboard-layout';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const AdminDashboard: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const [activeView, setActiveView] = useState('overview');
  const { user, isLoading } = useUser();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    navigate('/login/admin');
    return null;
  }

  const sidebarItems = [
    {
      icon: <Users className="h-5 w-5" />,
      label: 'User Management',
      onClick: () => setActiveView('users')
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: 'Analytics',
      onClick: () => setActiveView('analytics')
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: 'System Settings',
      onClick: () => setActiveView('settings')
    }
  ];

  if (activeView === 'users') {
    return (
      <DashboardLayout
        title="User Management"
        subtitle="Manage users and providers"
        user={user}
        sidebarItems={sidebarItems}
        headerActions={
          <Button variant="outline" onClick={() => setActiveView('overview')}>
            Back to Overview
          </Button>
        }
      >
        <UserManagement />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle="System overview and management"
      user={user}
      sidebarItems={sidebarItems}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">2,847</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+12%</p>
              <p className="text-xs text-gray-500">from last month</p>
            </div>
            <Progress value={75} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Active Providers</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">487</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+8%</p>
              <p className="text-xs text-gray-500">from last month</p>
            </div>
            <Progress value={65} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Appointments</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">12,456</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+19%</p>
              <p className="text-xs text-gray-500">from last month</p>
            </div>
            <Progress value={85} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-700 opacity-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-700">Revenue</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">$45,231</div>
            <div className="flex items-center space-x-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600 font-medium">+20%</p>
              <p className="text-xs text-gray-500">from last month</p>
            </div>
            <Progress value={90} className="mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card 
          className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100"
          onClick={() => setActiveView('users')}
        >
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">User Management</CardTitle>
                <CardDescription className="text-gray-600">
                  Manage users and providers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">2,847</span> total users
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Manage Users
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-600 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">Appointment Overview</CardTitle>
                <CardDescription className="text-gray-600">
                  View all system appointments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">12,456</span> this month
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                View Appointments
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-900">Analytics & Reports</CardTitle>
                <CardDescription className="text-gray-600">
                  System performance analytics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">98.5%</span> uptime
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Recent Activity</span>
            </CardTitle>
            <CardDescription>Latest system activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New user registered</p>
                  <p className="text-xs text-gray-600">Dr. Sarah Johnson joined as a cardiologist</p>
                </div>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Appointment completed</p>
                  <p className="text-xs text-gray-600">Patient consultation with Dr. Ahmed</p>
                </div>
                <span className="text-xs text-gray-500">15 min ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">System maintenance</p>
                  <p className="text-xs text-gray-600">Scheduled backup completed successfully</p>
                </div>
                <span className="text-xs text-gray-500">1 hour ago</span>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New lab result uploaded</p>
                  <p className="text-xs text-gray-600">Blood test results for Patient #1234</p>
                </div>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>System Health</span>
            </CardTitle>
            <CardDescription>Current system status and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Server Status</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <Progress value={98} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">98% uptime</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Database Performance</span>
                  <Badge className="bg-green-100 text-green-800">Optimal</Badge>
                </div>
                <Progress value={95} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">95% efficiency</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Storage Usage</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Moderate</Badge>
                </div>
                <Progress value={72} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">72% of 1TB used</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Active Sessions</span>
                  <Badge className="bg-blue-100 text-blue-800">Normal</Badge>
                </div>
                <Progress value={65} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">156 active users</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-900">System Alerts</span>
              </div>
              <p className="text-xs text-gray-600">
                No critical alerts at this time. All systems operating normally.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

