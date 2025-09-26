'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check } from 'lucide-react';
import { useNotificationStore, Notification } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

export function NotificationDropdown() {
  const {
    notifications,
    unreadedNotifCount,
    markAsRead,
    clearReadNotifications,
    fetchUnreadedNotification,
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);

  // When the popover closes, we permanently clear the items marked as read
  useEffect(() => {
    if (!isOpen) {
      clearReadNotifications();
      fetchUnreadedNotification({
        url: '/api/alerts',
      });
    }
  }, [isOpen, clearReadNotifications, fetchUnreadedNotification]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        >
          <Bell className="h-5 w-5" />
          {unreadedNotifCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadedNotifCount}
            </span>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4" align="end">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Notifications</h4>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => markAsRead(notification.id)}
                />
              ))
            ) : (
              <p className="text-sm text-center text-gray-500 py-4">
                You're all caught up!
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Sub-component for a single notification item
function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
}) {
  const isGood = notification.type === 'good';
  const isDestructive = notification.type === 'destructive';
  const isWarning = notification.type === 'warning';

  return (
    <div
      className={cn(
        'p-3 rounded-md transition-opacity',
        notification.read ? 'opacity-50' : ''
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-1 h-2 w-2 rounded-full flex-shrink-0',
            isGood && 'bg-green-500',
            isDestructive && 'bg-red-500',
            isWarning && 'bg-yellow-500',
            notification.read ? 'bg-gray-400' : ''
          )}
        ></div>
        <div className="flex-grow">
          <p className="text-sm font-semibold">{notification.title}</p>
          <p className="text-sm text-gray-600">{notification.description}</p>
        </div>
        {!notification.read && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 flex-shrink-0"
            onClick={onMarkAsRead}
            aria-label="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
