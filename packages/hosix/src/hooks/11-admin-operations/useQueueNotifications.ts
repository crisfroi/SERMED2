// WEEK 12 ADMIN 2: Waiting Rooms
// Hook: useQueueNotifications
// Purpose: Multi-channel notifications (SMS, email, push, call)
// Status: Production-ready

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

export type NotificationType = 'sms' | 'email' | 'push_notification' | 'call' | 'whatsapp';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'not_verified';

export interface QueueNotification {
  id: string;
  queue_entry_id: string;
  notification_type: NotificationType;
  status: NotificationStatus;
  destination: string;
  message_content: string;
  sent_at?: string;
  delivery_confirmation?: boolean;
  error_message?: string;
  retry_count: number;
  max_retries: number;
  next_retry_at?: string;
}

export interface NotificationPreferences {
  patient_id: string;
  prefer_sms: boolean;
  prefer_email: boolean;
  prefer_push: boolean;
  prefer_call: boolean;
  prefer_whatsapp: boolean;
  phone_number: string;
  email: string;
  push_token?: string;
}

export interface UseQueueNotificationsOptions {
  queueEntryId?: string;
  autoRefresh?: number;
  enabled?: boolean;
}

/**
 * Hook for managing queue notifications
 * - Send multi-channel notifications (SMS, email, push, calls)
 * - Track notification status
 * - Handle retry logic
 * - Manage delivery confirmation
 * - Get notification history
 */
export const useQueueNotifications = ({
  queueEntryId,
  autoRefresh = 5000,
  enabled = true,
}: UseQueueNotificationsOptions) => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [notificationLog, setNotificationLog] = useState<QueueNotification[]>([]);

  // Fetch notification history for queue entry
  const { data: notifications = [], isLoading } = useQuery<QueueNotification[]>({
    queryKey: ['queue-notifications', queueEntryId],
    queryFn: async () => {
      if (!queueEntryId) return [];
      try {
        const response = await fetch(`/api/v1/waiting-queue/${queueEntryId}/notifications`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotificationLog(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw err;
      }
    },
    enabled: enabled && !!queueEntryId,
    refetchInterval: autoRefresh,
    staleTime: autoRefresh - 1000,
  });

  // Get notification preferences for patient
  const { data: preferences } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences', queueEntryId],
    queryFn: async () => {
      if (!queueEntryId) return null;
      const response = await fetch(`/api/v1/waiting-queue/${queueEntryId}/notification-preferences`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
    enabled: enabled && !!queueEntryId,
  });

  // Send SMS notification
  const sendSMSMutation = useMutation({
    mutationFn: async (data: { queueEntryId: string; phoneNumber: string; message: string }) => {
      const response = await fetch('/api/v1/notifications/send-sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_entry_id: data.queueEntryId,
          phone_number: data.phoneNumber,
          message: data.message,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to send SMS');
      return response.json();
    },
    onSuccess: () => {
      if (queueEntryId) {
        queryClient.invalidateQueries({ queryKey: ['queue-notifications', queueEntryId] });
      }
    },
  });

  // Send Email notification
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { queueEntryId: string; email: string; subject: string; body: string }) => {
      const response = await fetch('/api/v1/notifications/send-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_entry_id: data.queueEntryId,
          email: data.email,
          subject: data.subject,
          body: data.body,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to send email');
      return response.json();
    },
    onSuccess: () => {
      if (queueEntryId) {
        queryClient.invalidateQueries({ queryKey: ['queue-notifications', queueEntryId] });
      }
    },
  });

  // Send Push notification
  const sendPushMutation = useMutation({
    mutationFn: async (data: { queueEntryId: string; pushToken: string; title: string; body: string }) => {
      const response = await fetch('/api/v1/notifications/send-push', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_entry_id: data.queueEntryId,
          push_token: data.pushToken,
          title: data.title,
          body: data.body,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to send push notification');
      return response.json();
    },
    onSuccess: () => {
      if (queueEntryId) {
        queryClient.invalidateQueries({ queryKey: ['queue-notifications', queueEntryId] });
      }
    },
  });

  // Send WhatsApp notification
  const sendWhatsAppMutation = useMutation({
    mutationFn: async (data: { queueEntryId: string; phoneNumber: string; message: string }) => {
      const response = await fetch('/api/v1/notifications/send-whatsapp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_entry_id: data.queueEntryId,
          phone_number: data.phoneNumber,
          message: data.message,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to send WhatsApp');
      return response.json();
    },
    onSuccess: () => {
      if (queueEntryId) {
        queryClient.invalidateQueries({ queryKey: ['queue-notifications', queueEntryId] });
      }
    },
  });

  // Make call notification
  const makeCallMutation = useMutation({
    mutationFn: async (data: { queueEntryId: string; phoneNumber: string; message: string }) => {
      const response = await fetch('/api/v1/notifications/make-call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_entry_id: data.queueEntryId,
          phone_number: data.phoneNumber,
          message: data.message,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to make call');
      return response.json();
    },
    onSuccess: () => {
      if (queueEntryId) {
        queryClient.invalidateQueries({ queryKey: ['queue-notifications', queueEntryId] });
      }
    },
  });

  // Send notification using preferred channels
  const sendMultiChannelNotification = useCallback(
    async (data: {
      queueEntryId: string;
      message: string;
      title?: string;
    }) => {
      if (!preferences) return;

      const channels: Array<{
        type: NotificationType;
        send: (payload: any) => Promise<any>;
      }> = [];

      if (preferences.prefer_sms) {
        channels.push({
          type: 'sms',
          send: () =>
            sendSMSMutation.mutateAsync({
              queueEntryId: data.queueEntryId,
              phoneNumber: preferences.phone_number,
              message: data.message,
            }),
        });
      }

      if (preferences.prefer_email) {
        channels.push({
          type: 'email',
          send: () =>
            sendEmailMutation.mutateAsync({
              queueEntryId: data.queueEntryId,
              email: preferences.email,
              subject: data.title || 'Queue Notification',
              body: data.message,
            }),
        });
      }

      if (preferences.prefer_push && preferences.push_token) {
        channels.push({
          type: 'push_notification',
          send: () =>
            sendPushMutation.mutateAsync({
              queueEntryId: data.queueEntryId,
              pushToken: preferences.push_token!,
              title: data.title || 'Queue Notification',
              body: data.message,
            }),
        });
      }

      if (preferences.prefer_whatsapp) {
        channels.push({
          type: 'whatsapp',
          send: () =>
            sendWhatsAppMutation.mutateAsync({
              queueEntryId: data.queueEntryId,
              phoneNumber: preferences.phone_number,
              message: data.message,
            }),
        });
      }

      if (preferences.prefer_call) {
        channels.push({
          type: 'call',
          send: () =>
            makeCallMutation.mutateAsync({
              queueEntryId: data.queueEntryId,
              phoneNumber: preferences.phone_number,
              message: data.message,
            }),
        });
      }

      // Send all in parallel, handle failures gracefully
      return Promise.allSettled(
        channels.map((channel) => channel.send().catch((err) => console.error(`${channel.type} failed:`, err)))
      );
    },
    [preferences, sendSMSMutation, sendEmailMutation, sendPushMutation, sendWhatsAppMutation, makeCallMutation]
  );

  // Retry failed notifications
  const retryFailedNotificationsMutation = useMutation({
    mutationFn: async (queueEntryId: string) => {
      const failedNotifications = notifications.filter(
        (n) => n.status === 'failed' && n.retry_count < n.max_retries
      );

      if (failedNotifications.length === 0) {
        return { message: 'No failed notifications to retry' };
      }

      const response = await fetch('/api/v1/notifications/retry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_entry_id: queueEntryId,
          notification_ids: failedNotifications.map((n) => n.id),
          timestamp: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error('Failed to retry notifications');
      return response.json();
    },
    onSuccess: () => {
      if (queueEntryId) {
        queryClient.invalidateQueries({ queryKey: ['queue-notifications', queueEntryId] });
      }
    },
  });

  // Get notification status summary
  const getNotificationStatusSummary = useCallback(() => {
    if (notifications.length === 0) {
      return { total: 0, sent: 0, failed: 0, pending: 0, delivered: 0 };
    }

    return {
      total: notifications.length,
      sent: notifications.filter((n) => n.status === 'sent').length,
      failed: notifications.filter((n) => n.status === 'failed').length,
      pending: notifications.filter((n) => n.status === 'pending').length,
      delivered: notifications.filter((n) => n.status === 'delivered').length,
    };
  }, [notifications]);

  return {
    // Data
    notifications,
    preferences,
    notificationLog,

    // Loading state
    isLoading,
    error,

    // Send functions
    sendSMS: sendSMSMutation.mutate,
    sendEmail: sendEmailMutation.mutate,
    sendPush: sendPushMutation.mutate,
    sendWhatsApp: sendWhatsAppMutation.mutate,
    makeCall: makeCallMutation.mutate,
    sendMultiChannel: sendMultiChannelNotification,

    // Retry
    retryFailedNotifications: retryFailedNotificationsMutation.mutate,

    // Status
    statusSummary: getNotificationStatusSummary(),

    // Loading states
    isSendingSMS: sendSMSMutation.isPending,
    isSendingEmail: sendEmailMutation.isPending,
    isSendingPush: sendPushMutation.isPending,
    isSendingWhatsApp: sendWhatsAppMutation.isPending,
    isCallingMaking: makeCallMutation.isPending,
    isRetrying: retryFailedNotificationsMutation.isPending,
  };
};
