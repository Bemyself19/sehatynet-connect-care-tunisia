import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Clock, 
  Calendar,
  FileText,
  CreditCard,
  Stethoscope,
  Video,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';
import { Notification, NotificationStats } from '@/types/notification';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useUser';

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async (unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const [notificationsData, statsData] = await Promise.all([
        unreadOnly ? api.getUnreadNotifications() : api.getNotifications(),
        api.getNotificationStats()
      ]);
      
      setNotifications(notificationsData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab === 'unread');
  }, [activeTab]);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_confirmed':
      case 'appointment_rescheduled':
      case 'appointment_cancelled':
        return <Calendar className="h-5 w-5" />;
      case 'video_consultation_starting':
        return <Video className="h-5 w-5" />;
      case 'prescription_ready':
        return <FileText className="h-5 w-5" />;
      case 'lab_results_available':
        return <Stethoscope className="h-5 w-5" />;
      case 'medical_record_added':
        return <FileText className="h-5 w-5" />;
      case 'payment_due':
      case 'payment_confirmed':
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get notification color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('justNow');
    if (diffInMinutes < 60) return t('minutesAgo', { count: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('hoursAgo', { count: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t('daysAgo', { count: diffInDays });
    
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await api.markNotificationAsRead(notification._id);
        setNotifications(prev => 
          prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
        );
        if (stats) {
          setStats({ ...stats, unread: Math.max(0, stats.unread - 1) });
        }
      }

      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      } else if (notification.relatedEntity?.type) {
        // Navigate based on entity type and user role
        switch (notification.relatedEntity.type) {
          case 'appointment':
            // Navigate to appropriate appointments page based on user role
            if (user?.role === 'doctor') {
              navigate('/dashboard/doctor/appointments');
            } else if (user?.role === 'patient') {
              navigate('/dashboard/patient/appointments');
            }
            break;
          case 'prescription':
            navigate(`/prescriptions/${notification.relatedEntity.id}`);
            break;
          case 'medicalRecord':
            navigate(`/medical-records/${notification.relatedEntity.id}`);
            break;
          case 'labResult':
            navigate(`/lab-results/${notification.relatedEntity.id}`);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to process notification');
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (stats) {
        setStats({ ...stats, unread: 0 });
      }
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the click handler
    try {
      await api.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (stats) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setStats({ ...stats, unread: Math.max(0, stats.unread - 1) });
        }
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const unreadCount = stats?.unread || 0;
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('notifications')}</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 
              ? t('unreadNotificationsCount', { count: unreadCount })
              : t('allNotificationsRead')
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchNotifications(activeTab === 'unread')}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {t('markAllRead')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('total')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('urgent')}</p>
                  <p className="text-2xl font-bold text-red-600">{stats.byPriority.urgent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('high')}</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.byPriority.high}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Check className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">{t('unread')}</p>
                  <p className="text-2xl font-bold text-green-600">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="unread" className="flex items-center space-x-2">
            <span>{t('unread')}</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">{t('all')}</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-6">
          <NotificationsList 
            notifications={filteredNotifications}
            loading={loading}
            error={error}
            onNotificationClick={handleNotificationClick}
            onDeleteNotification={handleDeleteNotification}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            formatTimeAgo={formatTimeAgo}
            t={t}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <NotificationsList 
            notifications={filteredNotifications}
            loading={loading}
            error={error}
            onNotificationClick={handleNotificationClick}
            onDeleteNotification={handleDeleteNotification}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            formatTimeAgo={formatTimeAgo}
            t={t}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Notifications List Component
interface NotificationsListProps {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  onNotificationClick: (notification: Notification) => void;
  onDeleteNotification: (id: string, event: React.MouseEvent) => void;
  getNotificationIcon: (type: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  formatTimeAgo: (date: string) => string;
  t: (key: string, options?: any) => string;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  loading,
  error,
  onNotificationClick,
  onDeleteNotification,
  getNotificationIcon,
  getPriorityColor,
  formatTimeAgo,
  t
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">{t('loadingNotifications')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{t('noNotificationsFound')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('notificationsWillAppearHere')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card 
          key={notification._id}
          className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(notification.priority)} ${
            !notification.isRead ? 'bg-blue-50/50' : ''
          }`}
          onClick={() => onNotificationClick(notification)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="p-2 rounded-full bg-white shadow-sm">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {t(notification.title, notification.title)}
                    </h3>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                    {notification.priority === 'urgent' && (
                      <Badge variant="destructive" className="text-xs">
                        {t('urgent')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {t(notification.message, notification.message)}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimeAgo(notification.createdAt)}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => onDeleteNotification(notification._id, e)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotificationsPage;
