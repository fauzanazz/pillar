import { and, eq } from 'drizzle-orm';

import { db } from '@/db/drizzle';
import { pushSubscriptions } from '@/db/schema';

export interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushSubscriptionRepository {
  async saveSubscription(userId: string, subscriptionData: SubscriptionData) {
    const { endpoint, keys } = subscriptionData;

    const result = await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint,
        p256dhKey: keys.p256dh,
        authKey: keys.auth,
      })
      .onConflictDoUpdate({
        target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
        set: {
          p256dhKey: keys.p256dh,
          authKey: keys.auth,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  }

  async getSubscriptionsByUserId(userId: string) {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
  }

  async removeSubscription(userId: string, endpoint?: string) {
    if (endpoint) {
      // Remove specific subscription
      return await db
        .delete(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            eq(pushSubscriptions.endpoint, endpoint),
          ),
        );
    } else {
      // Remove all subscriptions for user
      return await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
    }
  }

  async getAllSubscriptions() {
    return await db.select().from(pushSubscriptions);
  }

  async getSubscriptionsByUserIds(userIds: string[]) {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userIds[0])); // This would need to be updated for multiple users
  }
}

export const pushSubscriptionRepository = new PushSubscriptionRepository();
