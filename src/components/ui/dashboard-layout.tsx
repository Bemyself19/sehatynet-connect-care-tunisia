import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Menu, 
  X, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Stethoscope,
  Microscope,
  Camera,
  Pill,
  BarChart3,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/ui/logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  user: any;
  sidebarItems?: Array<{
    icon: React.ReactNode;
    label: string;
    href?: string;
    onClick?: () => void;
    badge?: string;
  }>;
  headerActions?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  user,
  sidebarItems = [],
  headerActions
}) => {
  const { logout } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <Stethoscope className="h-5 w-5" />;
      case 'patient': return <User className="h-5 w-5" />;
      case 'admin': return <Shield className="h-5 w-5" />;
      case 'lab': return <Microscope className="h-5 w-5" />;
      case 'radiologist': return <Camera className="h-5 w-5" />;
      case 'pharmacy': return <Pill className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'text-blue-600';
      case 'patient': return 'text-green-600';
      case 'admin': return 'text-purple-600';
      case 'lab': return 'text-orange-600';
      case 'radiologist': return 'text-indigo-600';
      case 'pharmacy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 to-blue-50", currentLanguage === 'ar' ? 'rtl' : 'ltr')}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              
              <Link to="/" className="flex items-center space-x-3 group">
                <BrandLogo size={32} />
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center space-x-1">
                    {getRoleIcon(user?.role || '')}
                    <span className={getRoleColor(user?.role || '')}>
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="rounded-full p-1">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </div>
                  </Button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <>
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-md border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                <p className="text-sm text-gray-500 mt-1">Quick access to features</p>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item, index) => (
                  <div key={index}>
                    {item.href ? (
                      <Link
                        to={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          location.pathname === item.href
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-5 h-5 transition-colors duration-200",
                            location.pathname === item.href ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                          )}>
                            {item.icon}
                          </div>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-5 h-5">{item.icon}</div>
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </nav>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-slate-200">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Need Help?</div>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </>

        {/* Main Content */}
        <div className="flex-1">
          {/* Page Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  )}
                </div>
                {headerActions && (
                  <div className="flex items-center space-x-4">
                    {headerActions}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page Content */}
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}; 