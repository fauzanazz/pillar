import webpush from 'web-push';

import { env } from '@/configs';

export interface PushSubscription {
  endpoint: string;
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
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class WebPushService {
  private static instance: WebPushService;

  constructor() {
    this.setupVapidKeys();
  }

  static getInstance(): WebPushService {
    if (!WebPushService.instance) {
      WebPushService.instance = new WebPushService();
    }
    return WebPushService.instance;
  }

  private setupVapidKeys(): void {
    // Set VAPID keys for web push
    webpush.setVapidDetails(
      'mailto:your-email@example.com', // Replace with your email
      env.VAPID_PUBLIC_KEY || this.generateVapidKeys().publicKey,
      env.VAPID_PRIVATE_KEY || this.generateVapidKeys().privateKey,
    );
  }

  /**
   * Generate VAPID keys if not provided in environment
   * In production, you should generate these once and store them in env variables
   */
  private generateVapidKeys(): { publicKey: string; privateKey: string } {
    console.warn(
      '⚠️ Generating VAPID keys on-the-fly. In production, set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your environment variables.',
    );

    const vapidKeys = webpush.generateVAPIDKeys();

    console.log('📋 Generated VAPID Keys:');
    console.log('Public Key:', vapidKeys.publicKey);
    console.log('Private Key:', vapidKeys.privateKey);
    console.log('Add these to your .env file:');
    console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

    return vapidKeys;
  }

  /**
   * Send push notification to a single subscription
   */
  async sendNotification(
    subscription: PushSubscription,
    payload: NotificationPayload,
  ): Promise<boolean> {
    try {
      const notificationPayload = JSON.stringify(payload);

      await webpush.sendNotification(subscription, notificationPayload, {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: this.getUrgencyFromPayload(payload),
      });

      console.log('✅ Push notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple subscriptions
   */
  async sendNotificationToMultiple(
    subscriptions: PushSubscription[],
    payload: NotificationPayload,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    const promises = subscriptions.map(async (subscription) => {
      const result = await this.sendNotification(subscription, payload);
      if (result) {
        success++;
      } else {
        failed++;
      }
    });

    await Promise.all(promises);

    console.log(
      `📊 Push notification results: ${success} successful, ${failed} failed`,
    );
    return { success, failed };
  }

  /**
   * Get urgency level based on notification content
   */
  private getUrgencyFromPayload(
    payload: NotificationPayload,
  ): 'very-low' | 'low' | 'normal' | 'high' {
    // Determine urgency based on notification content
    const title = payload.title.toLowerCase();
    const body = payload.body.toLowerCase();

    if (
      title.includes('critical') ||
      body.includes('critical') ||
      title.includes('urgent') ||
      body.includes('urgent')
    ) {
      return 'high';
    }

    if (
      title.includes('important') ||
      body.includes('important') ||
      title.includes('warning') ||
      body.includes('warning')
    ) {
      return 'normal';
    }
    return 'low';
  }

  /**
   * Create notification payload for alert events
   */
  createAlertNotification(
    alertType: string,
    severity: string,
    subject: string,
    body: string,
    contractId: string,
  ): NotificationPayload {
    const severityEmoji = this.getSeverityEmoji(severity);

    return {
      title: `${severityEmoji} ${subject}`,
      body: body || `New ${alertType} alert detected`,
      icon: '/icons/alert-icon.png', // Add your alert icon
      badge: '/icons/badge-icon.png', // Add your badge icon
      data: {
        alertType,
        severity,
        contractId,
        timestamp: new Date().toISOString(),
        url: `/contracts/${contractId}`, // URL to navigate when notification is clicked
      },
      actions: [
        {
          action: 'view',
          title: 'View Contract',
          icon: '/icons/view-icon.png',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png',
        },
      ],
    };
  }

  /**
   * Get emoji based on severity level
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🔔';
      case 'low':
      default:
        return 'ℹ️';
    }
  }

  /**
   * Get VAPID public key for client-side subscription
   */
  getVapidPublicKey(): string {
    return env.VAPID_PUBLIC_KEY || '';
  }
}

// Export singleton instance
export const webPushService = WebPushService.getInstance();
