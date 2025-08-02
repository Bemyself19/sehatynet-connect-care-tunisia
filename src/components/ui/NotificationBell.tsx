import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Calendar, FileText, Users, Settings, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/useUser';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  isRead: boolean;
  actionUrl?: string;
  relatedEntity?: {
    type: string;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

const NotificationBell: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [notificationsData, statsData] = await Promise.all([
        api.getUnreadNotifications(),
        api.getNotificationStats()
      ]);
      
      // Ensure notifications is always an array
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]); // Set empty array on error
      toast.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications([]);
      setStats(prev => prev ? { ...prev, unread: 0 } : null);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification._id);
    
    // Log all notification info for debugging
    console.log('[NotificationBell] Notification clicked:', notification);
    
    // First, check for specific notification types
    if (notification.type === 'lab_assignment' && user?.role === 'lab') {
      console.log('[NotificationBell] Lab assignment notification detected');
      navigate(`/dashboard/lab/results?id=${notification.relatedEntity?.id}`);
      setIsOpen(false);
      return;
    }
    
    if (notification.type === 'radiology_assignment' && user?.role === 'radiologist') {
      console.log('[NotificationBell] Radiology assignment notification detected');
      navigate(`/dashboard/radiologist/reports?id=${notification.relatedEntity?.id}`);
      setIsOpen(false);
      return;
    }
    
    if (notification.actionUrl) {
      console.log('[NotificationBell] Navigating to actionUrl:', notification.actionUrl);
      navigate(notification.actionUrl);
      setIsOpen(false);
      return;
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
          if (notification.type === 'pharmacy_assignment' && user?.role === 'pharmacy') {
            navigate(`/dashboard/pharmacy/prescriptions/${notification.relatedEntity.id}`);
          } else {
            navigate(`/prescriptions/${notification.relatedEntity.id}`);
          }
          break;
        case 'medication':
          if (user?.role === 'pharmacy') {
            navigate(`/dashboard/pharmacy/prescriptions/${notification.relatedEntity.id}`);
          } else {
            navigate(`/medical-records/${notification.relatedEntity.id}`);
          }
          break;
        case 'labResult':
          if (user?.role === 'lab') {
            navigate(`/dashboard/lab/results?id=${notification.relatedEntity.id}`);
          } else {
            navigate(`/medical-records/${notification.relatedEntity.id}`);
          }
          break;
        case 'radiologyResult':
          if (user?.role === 'radiologist') {
            navigate(`/dashboard/radiologist/reports?id=${notification.relatedEntity.id}`);
          } else {
            navigate(`/medical-records/${notification.relatedEntity.id}`);
          }
          break;
        case 'medicalRecord':
          const isValidObjectId = /^[a-fA-F0-9]{24}$/.test(notification.relatedEntity.id);
          if (isValidObjectId) {
              navigate(`/medical-records/${notification.relatedEntity.id}`);
          } else {
              // Optionally show a toast or log error
              console.warn('Invalid medical record id in notification:', notification.relatedEntity.id);
          }
          break;
        case 'labResult':
          navigate(`/lab-results/${notification.relatedEntity.id}`);
          break;
        default:
          break;
      }
    }
    setIsOpen(false);
  };

      // Get notification icon
      const getNotificationIcon = (type: string) => {
        switch (type) {
          case 'appointment_reminder':
          case 'appointment_confirmed':
          case 'appointment_cancelled':
            return <Calendar className="h-4 w-4" />;
          case 'prescription_ready':
          case 'prescription_updated':
            return <FileText className="h-4 w-4" />;
          case 'lab_result_ready':
          case 'lab_assignment':
          case 'lab_confirmed':
          case 'lab_ready':
            return <AlertCircle className="h-4 w-4" />;
          case 'system_maintenance':
            return <Settings className="h-4 w-4" />;
          case 'pharmacy_assignment':
            return <Pill className="h-4 w-4 text-green-600" />;
          case 'radiology_assignment':
            return <FileText className="h-4 w-4 text-blue-600" />;
          default:
            return <Bell className="h-4 w-4" />;
        }
      };  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = stats?.unread || 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t('notifications', 'Notifications')}</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {t('markAllRead', 'Mark all read')}
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('loadingNotifications', 'Loading notifications...')}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t('noNewNotifications', 'No new notifications')}</p>
              <p className="text-xs mt-1">{t('notificationsWillAppearHere', 'Notifications will appear here')}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => {
                    console.log('Notification item clicked', notification);
                    handleNotificationClick(notification);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {t(notification.title, notification.title)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {t(notification.message, notification.message)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
              >
                {t('viewAllNotifications', 'View all notifications')}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
