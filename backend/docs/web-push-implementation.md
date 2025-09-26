# Web Push Notifications - Complete Integration

This document outlines the complete web push notification system implementation for real-time contract alerts.

## Backend Implementation ✅

### 1. Database Schema

- **Table**: `push_subscriptions`
- **Fields**: user_id, endpoint, p256dh_key, auth_key, timestamps
- **Migration**: `drizzle/0008_wide_toad_men.sql`

### 2. Core Services

#### Web Push Service

- **Location**: `src/lib/web-push.ts`
- **Features**:
  - VAPID key management
  - Notification creation and sending
  - User-based notification delivery
  - Error handling and logging

#### Push Subscription Repository

- **Location**: `src/repositories/push-subscription.repository.ts`
- **Features**:
  - Save/update user subscriptions
  - Retrieve subscriptions by user ID
  - Remove subscriptions
  - Bulk operations

### 3. API Endpoints

#### Push Notification Routes

- **Location**: `src/routes/push-notification.route.ts`
- **Endpoints**:
  - `GET /push/vapid-key` - Get VAPID public key
  - `POST /push/subscribe` - Subscribe to notifications
  - `POST /push/unsubscribe` - Unsubscribe from notifications
  - `POST /push/test` - Send test notification
  - `POST /push/simulate` - Simulate notification

#### Controller Implementation

- **Location**: `src/controllers/push-notification.controller.ts`
- **Features**: OpenAPI integration, authentication, error handling

### 4. Alert Event Consumer

- **Location**: `src/services/alert-event-consumer.service.ts`
- **Features**:
  - RabbitMQ message consumption
  - AI alert detection and processing
  - Automatic push notification sending
  - User targeting based on subscriptions

## Frontend Integration 📋

### Required Files

1. **Service Worker**: `public/sw.js`
2. **Push Service**: `src/services/pushNotificationService.js`
3. **React Component**: `src/components/PushNotificationManager.jsx`

### Integration Steps

1. Register service worker
2. Request notification permissions
3. Subscribe to push notifications
4. Store subscription in backend
5. Handle incoming notifications

## Environment Configuration

### Backend (.env)

```bash
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### Frontend (.env)

```bash
REACT_APP_API_URL=http://localhost:3000
```

## How It Works

1. **User Subscribes**:
   - Frontend requests VAPID public key from backend
   - User grants notification permission
   - Browser creates push subscription
   - Subscription stored in backend database

2. **Alert Triggered**:
   - Contract event published to RabbitMQ
   - Alert consumer processes message
   - Push notification created and sent to relevant users
   - Browser displays notification

3. **User Interaction**:
   - Click notification opens app
   - Notification actions handled by service worker
   - App state updates accordingly

## Testing

### Backend Testing

```bash
# Start backend server
bun run dev

# Test VAPID key endpoint
curl http://localhost:3000/push/vapid-key

# Test notification (requires authentication)
curl -X POST http://localhost:3000/push/test \
  -H "Authorization: Bearer your_token"
```

### Frontend Testing

1. Open app in browser (must be HTTPS for production)
2. Click "Enable Notifications"
3. Grant permission when prompted
4. Click "Test Notification"
5. Check for notification display

## Production Considerations

### Security

- Use HTTPS in production (required for push notifications)
- Rotate VAPID keys periodically
- Validate subscription data
- Implement rate limiting

### Performance

- Batch notifications for multiple users
- Handle failed subscriptions gracefully
- Implement retry logic for failed sends
- Monitor notification delivery rates

### User Experience

- Provide notification preferences
- Allow granular control over alert types
- Implement quiet hours
- Support notification categories

## Troubleshooting

### Common Issues

1. **Notifications not working**: Check HTTPS, permissions, VAPID keys
2. **Service worker errors**: Verify SW registration and scope
3. **Backend errors**: Check database connection, VAPID configuration
4. **Browser compatibility**: Test across different browsers

### Debug Commands

```bash
# Check push subscriptions in database
SELECT * FROM push_subscriptions;

# Monitor RabbitMQ queues
bun run rabbitmq:status

# Check server logs
tail -f logs/app.log
```

## Next Steps

1. **Enhanced User Targeting**:
   - Implement contract-based user access control
   - Add notification preferences per user
   - Support user roles and permissions

2. **Advanced Features**:
   - Notification scheduling
   - Rich notifications with actions
   - Analytics and delivery tracking
   - A/B testing for notification content

3. **Monitoring**:
   - Add metrics for notification delivery
   - Track user engagement with notifications
   - Monitor subscription lifecycle

## Documentation

- **Frontend Guide**: [docs/web-push-frontend-integration.md](./web-push-frontend-integration.md)
- **API Documentation**: Available via OpenAPI at `/doc` endpoint
- **Database Schema**: See migration files in `drizzle/` directory
