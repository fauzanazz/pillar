# Web Push Notifications Frontend Integration Guide

This guide will help you integrate web push notifications on your frontend application to receive real-time alerts from the backend.

## Overview

The backend provides these endpoints for web push notifications:

- `GET /push/vapid-key` - Get the VAPID public key for subscription
- `POST /push/test` - Create a test notification (authenticated)
- `POST /push/simulate` - Simulate sending a notification (authenticated)

## Step 1: Service Worker Setup

Create a service worker file (`public/sw.js` or `public/service-worker.js`):

```javascript
// public/sw.js
self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  console.log('Push notification received:', data);

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function (event) {
  console.log('Notification clicked:', event.notification);

  event.notification.close();

  // Handle notification click actions
  if (event.action) {
    console.log('Action clicked:', event.action);
    // Handle specific actions
    switch (event.action) {
      case 'view':
        // Open the app or specific page
        event.waitUntil(clients.openWindow('/alerts'));
        break;
      case 'dismiss':
        // Just close the notification
        break;
    }
  } else {
    // Default click action - open the app
    event.waitUntil(clients.openWindow('/'));
  }
});

self.addEventListener('notificationclose', function (event) {
  console.log('Notification closed:', event.notification);
  // Track notification dismissal if needed
});
```

## Step 2: Frontend Push Notification Service

Create a push notification service (`src/services/pushNotificationService.js`):

```javascript
// src/services/pushNotificationService.js
class PushNotificationService {
  constructor() {
    this.vapidPublicKey = null;
    this.subscription = null;
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  }

  // Check if push notifications are supported
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check if user has granted notification permission
  hasPermission() {
    return Notification.permission === 'granted';
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Register service worker
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Get VAPID public key from backend
  async getVapidPublicKey() {
    try {
      const response = await fetch(\`\${this.apiBaseUrl}/push/vapid-key\`, {
        headers: {
          'Authorization': \`Bearer \${this.getAuthToken()}\`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get VAPID public key');
      }

      const data = await response.json();
      this.vapidPublicKey = data.data.publicKey;
      return this.vapidPublicKey;
    } catch (error) {
      console.error('Error getting VAPID public key:', error);
      throw error;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    if (!this.hasPermission()) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('Notification permission denied');
      }
    }

    try {
      // Register service worker
      const registration = await this.registerServiceWorker();

      // Get VAPID public key
      if (!this.vapidPublicKey) {
        await this.getVapidPublicKey();
      }

      // Convert VAPID key to Uint8Array
      const vapidKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
      });

      this.subscription = subscription;
      console.log('Push subscription successful:', subscription);

      // Send subscription to backend (you'll need to implement this endpoint)
      await this.sendSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) {
      return false;
    }

    try {
      const success = await this.subscription.unsubscribe();
      if (success) {
        this.subscription = null;
        // Optionally remove subscription from backend
        await this.removeSubscriptionFromBackend();
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Send subscription to backend (implement this endpoint in your backend)
  async sendSubscriptionToBackend(subscription) {
    try {
      const response = await fetch(\`\${this.apiBaseUrl}/push/subscribe\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${this.getAuthToken()}\`
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to backend');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      throw error;
    }
  }

  // Remove subscription from backend (implement this endpoint in your backend)
  async removeSubscriptionFromBackend() {
    try {
      const response = await fetch(\`\${this.apiBaseUrl}/push/unsubscribe\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${this.getAuthToken()}\`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error removing subscription from backend:', error);
      return false;
    }
  }

  // Test push notification
  async testNotification() {
    try {
      const response = await fetch(\`\${this.apiBaseUrl}/push/test\`, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.getAuthToken()}\`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  // Helper method to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get auth token (implement based on your auth system)
  getAuthToken() {
    // Replace with your actual token retrieval logic
    return localStorage.getItem('authToken') || '';
  }
}

export default new PushNotificationService();
```

## Step 3: React Component Integration

Create a React component for push notification management (`src/components/PushNotificationManager.jsx`):

```jsx
// src/components/PushNotificationManager.jsx
import React, { useEffect, useState } from 'react';

import pushNotificationService from '../services/pushNotificationService';

const PushNotificationManager = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsSupported(pushNotificationService.isSupported());
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    if (!pushNotificationService.isSupported()) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      await pushNotificationService.subscribe();
      setIsSubscribed(true);
      alert('Successfully subscribed to push notifications!');
    } catch (error) {
      setError(error.message);
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await pushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        alert('Successfully unsubscribed from push notifications');
      } else {
        setError('Failed to unsubscribe');
      }
    } catch (error) {
      setError(error.message);
      console.error('Unsubscribe error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setLoading(true);
    setError(null);

    try {
      await pushNotificationService.testNotification();
      alert('Test notification sent! Check your notifications.');
    } catch (error) {
      setError(error.message);
      console.error('Test notification error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="push-notification-manager">
        <p>⚠️ Push notifications are not supported in this browser.</p>
      </div>
    );
  }

  return (
    <div className="push-notification-manager">
      <h3>Push Notifications</h3>

      {error && (
        <div
          className="error-message"
          style={{ color: 'red', marginBottom: '10px' }}
        >
          {error}
        </div>
      )}

      <div className="notification-status">
        <p>Status: {isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed'}</p>
      </div>

      <div className="notification-controls">
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{ marginRight: '10px' }}
          >
            {loading ? 'Subscribing...' : 'Enable Notifications'}
          </button>
        ) : (
          <>
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              style={{ marginRight: '10px' }}
            >
              {loading ? 'Unsubscribing...' : 'Disable Notifications'}
            </button>
            <button onClick={handleTestNotification} disabled={loading}>
              {loading ? 'Sending...' : 'Test Notification'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PushNotificationManager;
```

## Step 4: Backend Subscription Management

You'll need to add these endpoints to your backend to manage user subscriptions:

```typescript
// Add these to your push notification controller

// Store user subscription
pushNotificationRouter.post('/push/subscribe', async (c) => {
  const user = c.var.user;
  const { subscription } = await c.req.json();

  // Store subscription in database (implement this)
  // await subscriptionRepository.saveSubscription(user.id, subscription);

  return c.json(
    createSuccessResponse(
      { message: 'Subscription saved successfully' },
      'Push notification subscription activated',
      200,
    ),
    200,
  );
});

// Remove user subscription
pushNotificationRouter.post('/push/unsubscribe', async (c) => {
  const user = c.var.user;

  // Remove subscription from database (implement this)
  // await subscriptionRepository.removeSubscription(user.id);

  return c.json(
    createSuccessResponse(
      { message: 'Subscription removed successfully' },
      'Push notification subscription deactivated',
      200,
    ),
    200,
  );
});
```

## Step 5: Database Schema for Subscriptions

Add a table to store user push subscriptions:

```sql
-- Add to your database schema
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, endpoint)
);
```

## Step 6: Integration with Your App

Add the PushNotificationManager component to your main app:

```jsx
// src/App.jsx
import React from 'react';

import PushNotificationManager from './components/PushNotificationManager';

function App() {
  return (
    <div className="App">
      {/* Your existing app content */}

      {/* Add push notification manager */}
      <PushNotificationManager />
    </div>
  );
}

export default App;
```

## Step 7: Environment Configuration

Add these environment variables to your frontend:

```env
# .env
REACT_APP_API_URL=http://localhost:3000
```

## Testing the Integration

1. **Start your backend server** with the web push endpoints
2. **Serve your frontend application** with HTTPS (required for push notifications)
3. **Open your app** and click "Enable Notifications"
4. **Grant permission** when prompted by the browser
5. **Click "Test Notification"** to verify the integration works

## Important Notes

1. **HTTPS Required**: Push notifications only work over HTTPS (except localhost)
2. **User Interaction**: Subscription must be triggered by user interaction
3. **Browser Support**: Check compatibility across different browsers
4. **Permission Handling**: Always handle permission denials gracefully
5. **Service Worker Scope**: Ensure your service worker has the correct scope

## Next Steps

1. Implement subscription storage in your backend
2. Integrate with your existing alert system
3. Add notification preferences for users
4. Implement notification action handlers
5. Add analytics to track notification engagement

This integration will allow your users to receive real-time push notifications for contract alerts and other important events from your application.
