import {
  AlertWithContract,
  getAlerts,
  GetAlertsData,
  getUnreadAlertsCount,
  markAlertAsRead,
} from '@/api';
import { create } from 'zustand';

export interface Notification {
  id: number;
  title: string;
  description: string;
  type: 'good' | 'warning' | 'destructive';
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadedNotifCount: number;
  markAsRead: (id: number) => void;
  clearReadNotifications: () => void;
  fetchUnreadedNotification: (notifications: GetAlertsData) => Promise<void>;
}

// Mock data for demonstration
const initialNotifications: Notification[] = [
  {
    id: 1,
    title: 'Contract Approved',
    description: 'Contract "Alpha Project" has been approved by management.',
    type: 'good',
    read: false,
  },
  {
    id: 2,
    title: 'Action Required',
    description: 'Contract "Beta Initiative" was rejected by the legal team.',
    type: 'destructive',
    read: false,
  },
  {
    id: 3,
    title: 'New Contract Submitted',
    description: 'A new contract "Gamma Proposal" is awaiting your review.',
    type: 'good',
    read: false,
  },
];

const mapAlertToNotification = (alert: AlertWithContract): Notification => ({
  id: alert.id,
  title: alert.contract?.title || 'Unknown Contract',
  description: alert.message, // Assuming the API returns 'message' for the description
  type: alert.priority ? priorityType(alert.priority) : 'good',
  read: alert.isRead,
});
const priorityType = (priority: string) => {
  switch (priority) {
    case 'low':
      return 'good';
    case 'medium':
      return 'warning';
    case 'high':
      return 'destructive';
    default:
      return 'good';
  }
};

export const useNotificationStore = create<NotificationState>(set => ({
  notifications: initialNotifications,
  unreadedNotifCount: 0,
  markAsRead: (id: number) => {
    markAlertAsRead({
      path: {
        id: id.toString(),
      },
      body: {
        isRead: true,
      },
    });
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadedNotifCount: state.unreadedNotifCount - 1,
    }));
  },

  fetchUnreadedNotification: async () => {
    try {
      const response = await getAlerts({
        query: {
          isRead: 'false',
        },
      });

      const fetchedAlerts = response.data?.data?.alerts || [];
      const formattedNotifications = fetchedAlerts.map(mapAlertToNotification);

      set({
        notifications: formattedNotifications,
        unreadedNotifCount: fetchedAlerts.length,
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  clearReadNotifications: () =>
    set(state => ({
      notifications: state.notifications.filter(n => !n.read),
    })),
}));
