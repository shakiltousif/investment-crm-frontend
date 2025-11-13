'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';
import { getSocket, disconnectSocket, reconnectSocket } from '@/lib/socket';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (filters?: { isRead?: boolean; type?: string; limit?: number; offset?: number }) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (filters?: { isRead?: boolean; type?: string; limit?: number; offset?: number }) => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.notifications.getAll(filters);
      setNotifications(response.data.data.notifications || []);
      setUnreadCount(response.data.data.unreadCount || 0);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await api.notifications.getUnreadCount();
      setUnreadCount(response.data.data.count || 0);
    } catch (err: any) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [isAuthenticated, user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: notif.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Failed to mark all as read:', err);
      throw err;
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await api.notifications.delete(notificationId);
      const deleted = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, [notifications]);

  // Initialize socket and fetch notifications on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      return;
    }

    // Connect socket
    const socket = getSocket();
    if (!socket) return;

    // Fetch initial notifications
    fetchNotifications({ limit: 20 }).catch(console.error);

    // Socket event listeners
    const handleNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleNotificationRead = (data: { notificationId: string; isRead: boolean }) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === data.notificationId
            ? { ...notif, isRead: data.isRead, readAt: data.isRead ? new Date().toISOString() : undefined }
            : notif
        )
      );
      if (data.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handleAllRead = () => {
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          isRead: true,
          readAt: notif.readAt || new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    };

    const handleNotificationDeleted = (data: { notificationId: string }) => {
      setNotifications((prev) => {
        const deleted = prev.find((n) => n.id === data.notificationId);
        if (deleted && !deleted.isRead) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((notif) => notif.id !== data.notificationId);
      });
    };

    socket.on('notification', handleNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notifications:all-read', handleAllRead);
    socket.on('notification:deleted', handleNotificationDeleted);

    // Cleanup on unmount
    return () => {
      socket.off('notification', handleNotification);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notifications:all-read', handleAllRead);
      socket.off('notification:deleted', handleNotificationDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Reconnect socket when user ID changes (but only if authenticated)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const socket = getSocket();
      if (socket && !socket.connected) {
        reconnectSocket();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

