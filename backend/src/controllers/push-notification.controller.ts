import { createAuthRouter, createSuccessResponse } from '@/lib';
import { webPushService } from '@/lib/web-push';
import {
  getVapidPublicKeyRoute,
  simulatePushNotificationRoute,
  testPushNotificationRoute,
} from '@/routes/push-notification.route';

export const pushNotificationRouter = createAuthRouter();

// Get VAPID public key for client-side subscription
pushNotificationRouter.openapi(getVapidPublicKeyRoute, async (c) => {
  const publicKey = webPushService.getVapidPublicKey();

  return c.json(
    createSuccessResponse(
      { publicKey: publicKey || '' },
      'VAPID public key retrieved successfully',
      200,
    ),
    200,
  );
});

// Test push notification endpoint
pushNotificationRouter.openapi(testPushNotificationRoute, async (c) => {
  // Create a test notification
  const testNotification = webPushService.createAlertNotification(
    'ai.test',
    'high',
    '🧪 Test Push Notification',
    'This is a test push notification from the alert system.',
    '123',
  );

  console.log('📱 Test push notification created:');
  console.log(JSON.stringify(testNotification, null, 2));

  // In a real implementation, you would send this to actual subscriptions
  // For now, we'll just return the notification payload
  return c.json(
    createSuccessResponse(
      {
        message: 'Test notification created',
        notification: testNotification,
        instructions: [
          '1. To test push notifications, you need to:',
          '2. Set up a frontend to subscribe to push notifications',
          '3. Store user subscriptions in your database',
          '4. Use the subscription data to send actual notifications',
        ],
      },
      'Test push notification prepared',
      200,
    ),
    200,
  );
});

// Endpoint to simulate sending a push notification
pushNotificationRouter.openapi(simulatePushNotificationRoute, async (c) => {
  // Example of how you would send a notification with actual subscriptions
  const exampleSubscription = {
    endpoint: 'https://example.com/push-service/subscription-id',
    keys: {
      p256dh: 'example-p256dh-key',
      auth: 'example-auth-key',
    },
  };

  const notification = webPushService.createAlertNotification(
    'ai.contract.risk',
    'critical',
    '🚨 Critical Contract Risk Detected',
    'A high-risk clause has been identified in Contract #456',
    '456',
  );

  // This would normally send to real subscriptions
  // const result = await webPushService.sendNotification(exampleSubscription, notification);

  return c.json(
    createSuccessResponse(
      {
        message: 'Push notification simulation completed',
        notification,
        exampleSubscription,
        note: 'This is a simulation. To send real notifications, replace exampleSubscription with actual user subscriptions from your database.',
      },
      'Push notification simulated',
      200,
    ),
    200,
  );
});
