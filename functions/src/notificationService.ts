import * as webPush from 'web-push';
import * as storage from './storage';

// Get VAPID keys from environment variables
// In Firebase, set using: firebase functions:config:set vapid.public_key="..." vapid.private_key="..."
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn('⚠️ VAPID keys not configured. Push notifications will not work.');
  console.warn('Set them using: firebase functions:config:set vapid.public_key="..." vapid.private_key="..."');
} else {
  // Configure web-push with VAPID details
  webPush.setVapidDetails(
    'mailto:smartaid@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('✅ Web push configured with VAPID keys');
}

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

export async function sendNotification(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // Get user's push subscriptions from Firestore
    const subscriptions = await storage.getNotificationSubscriptions(userId);
    
    if (!subscriptions || subscriptions.length === 0) {
      console.warn(`No push subscriptions found for user: ${userId}`);
      return false;
    }

    const notificationPayload = JSON.stringify(payload);
    let sentCount = 0;

    // Send to all user's subscriptions
    for (const sub of subscriptions) {
      try {
        const pushSubscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
          expirationTime: sub.expirationTime?.getTime() || null,
        };

        await webPush.sendNotification(
          pushSubscription,
          notificationPayload,
          {
            TTL: 60 * 60 * 24, // 24 hours
          }
        );

        sentCount++;
        console.log(`✅ Notification sent to endpoint: ${sub.endpoint.substring(0, 50)}...`);
      } catch (error: any) {
        console.error('Failed to send to subscription:', error.message);
        
        // Remove invalid subscriptions (410 Gone = subscription expired)
        if (error.statusCode === 410) {
          console.log(`🗑️ Removing expired subscription: ${sub.endpoint}`);
          await storage.deleteNotificationSubscription(sub.endpoint);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`📬 Successfully sent ${sentCount} notification(s) to user: ${userId}`);
      return true;
    } else {
      console.warn(`❌ Failed to send notifications to user: ${userId}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function sendTestNotification(userId: string): Promise<boolean> {
  const payload: NotificationPayload = {
    title: '✨ Test Notification',
    body: 'SmartAid notifications are working correctly!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'test-notification',
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
    },
    url: '/',
  };

  return sendNotification(userId, payload);
}

export async function sendMedicationReminder(
  userId: string,
  medicationName: string,
  scheduledTime: string
): Promise<boolean> {
  const payload: NotificationPayload = {
    title: '💊 Time for Your Medication',
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

  return sendNotification(userId, payload);
}

export async function sendRefillReminder(
  userId: string,
  medicationName: string,
  pillsRemaining: number
): Promise<boolean> {
  const payload: NotificationPayload = {
    title: '🔔 Medication Refill Reminder',
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

  return sendNotification(userId, payload);
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY || '';
}
