import webPush from 'web-push';

// VAPID keys for push notifications
const VAPID_PUBLIC_KEY = 'BBEsjVCx64dmyQ3QVXU1cQVjAx5h9dFMoVcDQt3-pvrEtDtv4CuhVcb4qjqhA26JucFEBPaYy7nOFxhsS4J8SfE';
const VAPID_PRIVATE_KEY = 'pzYanYnNQBYZXiYnM-955MAiur3SD1rOn2WD9tGl2tM';

// Configure web-push with VAPID details
webPush.setVapidDetails(
  'mailto:smartaid@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  url?: string;
}

class NotificationService {
  private subscriptions: Map<string, PushSubscription> = new Map();

  getVapidPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  addSubscription(userId: string, subscription: PushSubscription): void {
    this.subscriptions.set(userId, subscription);
    console.log('Subscription added for user:', userId);
  }

  removeSubscription(userId: string): void {
    this.subscriptions.delete(userId);
    console.log('Subscription removed for user:', userId);
  }

  async sendNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    const subscription = this.subscriptions.get(userId);
    
    if (!subscription) {
      console.warn('No subscription found for user:', userId);
      return false;
    }

    try {
      const notificationPayload = JSON.stringify(payload);
      
      await webPush.sendNotification(
        subscription,
        notificationPayload,
        {
          TTL: 60 * 60 * 24, // 24 hours
        }
      );
      
      console.log('Notification sent successfully to:', userId);
      return true;
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      
      // Remove subscription if it's invalid (410 Gone)
      if (error.statusCode === 410) {
        this.removeSubscription(userId);
      }
      
      return false;
    }
  }

  async sendRefillReminder(
    userId: string,
    medicationName: string,
    pillsRemaining: number
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Medication Refill Reminder',
      body: `${medicationName} is running low (${pillsRemaining} pills remaining). Time to refill!`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `refill-${medicationName}`,
      data: {
        type: 'refill-reminder',
        medicationName,
        pillsRemaining,
      },
      url: '/schedule',
    };

    return this.sendNotification(userId, payload);
  }

  async sendMedicationReminder(
    userId: string,
    medicationName: string,
    scheduledTime: string
  ): Promise<boolean> {
    const payload: NotificationPayload = {
      title: 'Time for Your Medication',
      body: `Don't forget to take ${medicationName} at ${scheduledTime}`,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `medication-${medicationName}`,
      data: {
        type: 'medication-reminder',
        medicationName,
        scheduledTime,
      },
      url: '/scan',
    };

    return this.sendNotification(userId, payload);
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

export const notificationService = new NotificationService();
