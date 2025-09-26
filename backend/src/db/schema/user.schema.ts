import {
  boolean,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { createId, getNow } from '../db-helper';

export const user = pgTable('user', {
  id: varchar('id').primaryKey().unique().$defaultFn(createId),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  bio: text('bio'),
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).notNull(),
});

// Types
export type User = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;
