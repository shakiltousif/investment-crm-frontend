'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, ExternalLink, Filter, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadNotifications();
  }, [filter, selectedType, page]);

  const loadNotifications = async () => {
    const filters: any = {
      limit,
      offset: (page - 1) * limit,
    };

    if (filter === 'unread') {
      filters.isRead = false;
    } else if (filter === 'read') {
      filters.isRead = true;
    }

    if (selectedType !== 'all') {
      filters.type = selectedType;
    }

    const result = await fetchNotifications(filters);
    // Note: fetchNotifications doesn't return total, we'll use notifications.length for now
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const notificationTypes = [
    'all',
    'ACCOUNT_CREATED',
    'ACCOUNT_LOCKED',
    'ACCOUNT_UNLOCKED',
    'KYC_STATUS_CHANGE',
    'DOCUMENT_STATUS_CHANGE',
    'DOCUMENT_UPLOADED',
    'DEPOSIT_SUBMITTED',
    'DEPOSIT_STATUS_CHANGE',
    'WITHDRAWAL_SUBMITTED',
    'WITHDRAWAL_STATUS_CHANGE',
    'INVESTMENT_APPLICATION_SUBMITTED',
    'INVESTMENT_APPLICATION_STATUS_CHANGE',
    'INVESTMENT_PURCHASE',
    'INVESTMENT_MATURED',
    'BALANCE_ADJUSTMENT',
    'ADMIN_NOTIFICATION',
  ];

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.isRead) return false;
    if (filter === 'read' && !notif.isRead) return false;
    if (selectedType !== 'all' && notif.type !== selectedType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('all');
                    setPage(1);
                  }}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('unread');
                    setPage(1);
                  }}
                >
                  Unread
                </Button>
                <Button
                  variant={filter === 'read' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('read');
                    setPage(1);
                  }}
                >
                  Read
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {notificationTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No notifications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                !notification.isRead ? 'border-l-4 border-l-primary bg-blue-50/30' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      {!notification.isRead && (
                        <div className="mt-1.5 h-2 w-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                          {notification.actionUrl && (
                            <span className="flex items-center gap-1 text-primary">
                              <ExternalLink className="h-3 w-3" />
                              View details
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="h-8 w-8 p-0"
                        aria-label="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                      aria-label="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredNotifications.length >= limit && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={filteredNotifications.length < limit}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

