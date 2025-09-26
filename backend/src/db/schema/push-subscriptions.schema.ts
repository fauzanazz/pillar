import {
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id').notNull(),
    endpoint: text('endpoint').notNull(),
    p256dhKey: text('p256dh_key').notNull(),
    authKey: text('auth_key').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserEndpoint: unique().on(table.userId, table.endpoint),
  }),
);

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
