import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Calendar, FileText, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  translationData?: Record<string, any>;
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
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Helper function to translate notification title
  const getTranslatedTitle = (notification: Notification): string => {
    // If it's a translation key, translate it
    if (notification.title && !notification.title.includes(' ')) {
      return t(notification.title) || notification.title;
    }
    // Otherwise, return as is (fallback for existing notifications)
    return notification.title;
  };

  // Helper function to translate notification message
  const getTranslatedMessage = (notification: Notification): string => {
    // If it's a translation key and we have translation data, use interpolation
    if (notification.message && !notification.message.includes(' ') && notification.translationData) {
      const translated = t(notification.message, notification.translationData as any);
      return typeof translated === 'string' ? translated : notification.message;
    }
    // Otherwise, return as is (fallback for existing notifications)
    return notification.message;
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token found, skipping notification fetch');
        setNotifications([]);
        setStats(null);
        return;
      }

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
      // Don't show toast error if it's just an auth issue
      if (error instanceof Error && !error.message.includes('401') && !error.message.includes('Unauthorized')) {
        toast.error('Failed to fetch notifications');
      }
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
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.relatedEntity?.type && notification.relatedEntity?.id) {
      // Navigate based on entity type and notification type
      switch (notification.relatedEntity.type) {
        case 'appointment':
          // Invalidate appointments query to ensure fresh data
          await queryClient.invalidateQueries({ queryKey: ['appointments'] });
          
          // Navigate to appropriate appointments page based on notification type
          if (notification.type === 'appointment_pending') {
            // Doctor notification - go to doctor appointments page
            navigate(`/dashboard/doctor/appointments`);
          } else if (notification.type === 'appointment_confirmed') {
            // Patient notification - go to patient appointments page
            navigate(`/dashboard/patient/appointments`);
          } else {
            // Default to appointments page based on current user context
            navigate(`/dashboard/doctor/appointments`);
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
    
    setIsOpen(false);
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment_reminder':
      case 'appointment_confirmed':
      case 'appointment_cancelled':
      case 'appointment_pending':
        return <Calendar className="h-4 w-4" />;
      case 'prescription_ready':
      case 'prescription_updated':
        return <FileText className="h-4 w-4" />;
      case 'lab_result_ready':
        return <AlertCircle className="h-4 w-4" />;
      case 'system_maintenance':
        return <Settings className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Get priority color
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
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${getPriorityColor(notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getTranslatedTitle(notification)}
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
                        {getTranslatedMessage(notification)}
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
