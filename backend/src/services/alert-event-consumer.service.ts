import type amqp from 'amqplib';

import { QUEUES, rabbitMQService } from '@/lib/rabbitmq';
import type { MessagePayload } from '@/lib/rabbitmq';
import { webPushService } from '@/lib/web-push';
import type { NotificationPayload, PushSubscription } from '@/lib/web-push';

export interface AIAlertEvent {
  alert_id: string;
  type: string;
  severity: string;
  aggregate_id: string;
  facts: {
    ai_generated: boolean;
    source: string;
    [key: string]: unknown;
  };
  rendered: {
    subject: string;
    body_text: string;
  };
  source: {
    job_id: string;
    agent_version: string;
  };
  occurred_at: string;
}

export interface AlertEventEnvelope {
  event: AIAlertEvent;
  metadata?: {
    timestamp?: string;
    correlation_id?: string;
    [key: string]: unknown;
  };
}

export class AlertEventConsumer {
  private static instance: AlertEventConsumer;
  private isConsuming = false;

  static getInstance(): AlertEventConsumer {
    if (!AlertEventConsumer.instance) {
      AlertEventConsumer.instance = new AlertEventConsumer();
    }
    return AlertEventConsumer.instance;
  }

  /**
   * Start consuming alert events from the alerts queue
   */
  async startConsuming(): Promise<void> {
    if (this.isConsuming) {
      console.log('Alert event consumer is already running');
      return;
    }

    try {
      console.log('Starting Alert Event Consumer...');

      await rabbitMQService.consumeFromQueue(
        QUEUES.ALERTS_EVENTS,
        this.handleAlertMessage.bind(this),
        {
          consumerTag: 'alert-event-consumer',
        },
      );

      this.isConsuming = true;
      console.log('✅ Alert Event Consumer started successfully');
      console.log(
        `📨 Listening for messages on queue: ${QUEUES.ALERTS_EVENTS}`,
      );
      console.log('🔍 Supported routing keys:');
      console.log('   - alert.ai.risk.identified (AI-generated alerts)');
      console.log('   - contract.expiring');
      console.log('   - contract.clause.missing');
      console.log('   - contract.anomaly');
    } catch (error) {
      console.error('❌ Failed to start Alert Event Consumer:', error);
      this.isConsuming = false;
      throw error;
    }
  }

  /**
   * Handle incoming alert messages
   */
  private async handleAlertMessage(
    messagePayload: MessagePayload,
    msg: amqp.ConsumeMessage | null,
  ): Promise<void> {
    try {
      console.log('\n🚨 ========== NEW ALERT MESSAGE RECEIVED ==========');
      console.log('📅 Timestamp:', new Date().toISOString());

      if (msg) {
        console.log('📋 Message Properties:');
        console.log('   - Message ID:', msg.properties.messageId || 'N/A');
        console.log(
          '   - Correlation ID:',
          msg.properties.correlationId || 'N/A',
        );
        console.log('   - Routing Key:', msg.fields.routingKey);
        console.log('   - Exchange:', msg.fields.exchange);
        console.log('   - Delivery Tag:', msg.fields.deliveryTag);

        if (msg.properties.headers) {
          console.log('📝 Headers:');
          Object.entries(msg.properties.headers).forEach(([key, value]) => {
            console.log(`   - ${key}: ${value}`);
          });
        }
      }

      console.log('\n📦 Message Payload:');
      console.log(JSON.stringify(messagePayload, null, 2));

      // Try to parse as AI alert event if it matches the expected structure
      if (this.isAIAlertEvent(messagePayload)) {
        console.log('\n🤖 AI Alert Event Detected:');
        this.printAIAlertEvent(messagePayload as unknown as AlertEventEnvelope);

        // Send web push notification for AI alerts
        await this.sendWebPushForAIAlert(
          messagePayload as unknown as AlertEventEnvelope,
        );
      } else {
        console.log('\n📢 Standard Alert Event:');
        console.log(
          'This appears to be a standard alert event (not AI-generated)',
        );

        // Send web push notification for standard alerts
        await this.sendWebPushForStandardAlert(messagePayload, msg);
      }

      console.log('\n================================================\n');
    } catch (error) {
      console.error('❌ Error processing alert message:', error);
      throw error; // Let the consumer handle the error (nack the message)
    }
  }

  /**
   * Send web push notification for AI alert events
   */
  private async sendWebPushForAIAlert(
    envelope: AlertEventEnvelope,
  ): Promise<void> {
    try {
      const { event } = envelope;

      // Create notification payload
      const notification = webPushService.createAlertNotification(
        event.type,
        event.severity,
        event.rendered.subject,
        event.rendered.body_text,
        event.aggregate_id,
      );

      console.log('📱 Creating web push notification for AI alert...');
      console.log(
        'Notification payload:',
        JSON.stringify(notification, null, 2),
      );

      // In a real implementation, you would:
      // 1. Get user subscriptions from database based on contract/alert preferences
      // 2. Send notifications to relevant users

      // For demo purposes, we'll just show how it would work
      await this.sendNotificationToSubscribers(notification, event);
    } catch (error) {
      console.error('❌ Error sending web push for AI alert:', error);
    }
  }

  /**
   * Send web push notification for standard alert events
   */
  private async sendWebPushForStandardAlert(
    payload: MessagePayload,
    msg: amqp.ConsumeMessage | null,
  ): Promise<void> {
    try {
      // Extract information from standard alert payload
      const routingKey = msg?.fields.routingKey || 'unknown';
      const severity = this.extractSeverityFromRoutingKey(routingKey);

      // Create a generic notification for standard alerts
      const notification = webPushService.createAlertNotification(
        routingKey,
        severity,
        `Alert: ${routingKey}`,
        'A contract alert has been detected.',
        'unknown', // Contract ID might not be available in standard alerts
      );

      console.log('📱 Creating web push notification for standard alert...');
      console.log(
        'Notification payload:',
        JSON.stringify(notification, null, 2),
      );

      await this.sendNotificationToSubscribers(notification, null);
    } catch (error) {
      console.error('❌ Error sending web push for standard alert:', error);
    }
  }

  /**
   * Send notification to all relevant subscribers
   */
  private async sendNotificationToSubscribers(
    notification: NotificationPayload,
    event: AIAlertEvent | null,
  ): Promise<void> {
    try {
      // In a real implementation, you would:
      // 1. Query database for user push subscriptions
      // 2. Filter subscriptions based on user preferences and contract access
      // 3. Send notifications to filtered subscriptions

      // Demo: Simulating subscriptions (replace with actual database query)
      const mockSubscriptions = await this.getMockUserSubscriptions(
        event?.aggregate_id,
      );

      if (mockSubscriptions.length === 0) {
        console.log('📭 No active push subscriptions found');
        return;
      }

      console.log(
        `📤 Sending push notification to ${mockSubscriptions.length} subscribers...`,
      );

      // Send notifications
      const result = await webPushService.sendNotificationToMultiple(
        mockSubscriptions,
        notification,
      );

      console.log(
        `✅ Push notifications sent: ${result.success} successful, ${result.failed} failed`,
      );
    } catch (error) {
      console.error('❌ Error sending notifications to subscribers:', error);
    }
  }

  /**
   * Extract severity from routing key for standard alerts
   */
  private extractSeverityFromRoutingKey(routingKey: string): string {
    if (routingKey.includes('expiring')) return 'high';
    if (routingKey.includes('missing')) return 'medium';
    if (routingKey.includes('anomaly')) return 'high';
    if (routingKey.includes('ai.risk')) return 'critical';
    return 'medium';
  }

  /**
   * Get mock user subscriptions (replace with actual database query)
   */
  private async getMockUserSubscriptions(
    contractId?: string,
  ): Promise<PushSubscription[]> {
    // In a real implementation, this would query your database for:
    // 1. Users who have push notifications enabled
    // 2. Users who have access to the specific contract (if contractId provided)
    // 3. Users' push subscription details

    console.log(
      `🔍 Looking for push subscriptions for contract: ${contractId || 'all'}`,
    );

    // Mock subscriptions for demo (replace with actual database query)
    return [
      // Example subscription structure - you'll get these from your database
      // {
      //   endpoint: 'https://fcm.googleapis.com/fcm/send/...',
      //   keys: {
      //     p256dh: 'BL...',
      //     auth: 'xx...'
      //   }
      // }
    ];
  }

  /**
   * Check if the message is an AI alert event
   */
  private isAIAlertEvent(payload: MessagePayload): boolean {
    const event = (payload as unknown as AlertEventEnvelope).event;
    return !!(
      event &&
      event.alert_id &&
      event.type &&
      event.type.startsWith('ai.') &&
      event.facts &&
      event.facts.ai_generated === true
    );
  }

  /**
   * Print formatted AI alert event
   */
  private printAIAlertEvent(envelope: AlertEventEnvelope): void {
    const { event } = envelope;

    console.log(`🆔 Alert ID: ${event.alert_id}`);
    console.log(`🏷️  Type: ${event.type}`);
    console.log(`⚠️  Severity: ${event.severity}`);
    console.log(`📄 Contract ID: ${event.aggregate_id}`);
    console.log(`📅 Occurred At: ${event.occurred_at}`);

    console.log('\n📊 Facts:');
    Object.entries(event.facts).forEach(([key, value]) => {
      console.log(`   - ${key}: ${JSON.stringify(value)}`);
    });

    console.log('\n📝 Rendered Message:');
    console.log(`   Subject: ${event.rendered.subject}`);
    console.log(`   Body: ${event.rendered.body_text}`);

    console.log('\n🔧 Source:');
    console.log(`   Job ID: ${event.source.job_id}`);
    console.log(`   Agent Version: ${event.source.agent_version}`);
  }

  /**
   * Stop consuming (graceful shutdown)
   */
  async stopConsuming(): Promise<void> {
    if (!this.isConsuming) {
      console.log('Alert event consumer is not running');
      return;
    }

    console.log('🛑 Stopping Alert Event Consumer...');
    this.isConsuming = false;
    // Note: In a real implementation, you might want to store and cancel the consumer tag
    console.log('✅ Alert Event Consumer stopped');
  }

  /**
   * Get consumer status
   */
  isRunning(): boolean {
    return this.isConsuming;
  }
}

// Export singleton instance
export const alertEventConsumer = AlertEventConsumer.getInstance();
