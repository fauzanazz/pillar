import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { getNow } from '../db-helper';
import { user } from './user.schema';

export const contracts = pgTable('contracts', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  title: varchar('title').notNull(),
  description: text('description'),
  endDate: date('end_date'),
  status: varchar('status').notNull(), // Draft, Legal Review, Management Review, Accepted, Rejected, Canceled
  riskScore: integer('risk_score').default(0),
  createdBy: varchar('created_by').references(() => user.id),
  updatedBy: varchar('updated_by').references(() => user.id),
  urlContract: text('url_contract'), // lokasi PDF / file
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).notNull(),
});

export const contractVersions = pgTable('contract_versions', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id)
    .notNull(),
  filePath: text('file_path').notNull(),
  versionNo: integer('version_no').notNull(),
  createdBy: varchar('created_by').references(() => user.id),
  updatedBy: varchar('updated_by').references(() => user.id),
  uploadedAt: timestamp('uploaded_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).notNull(),
});

export const contractParties = pgTable('contract_parties', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id)
    .notNull(),
  partyName: varchar('party_name').notNull(),
  partyRole: varchar('party_role').notNull(), // vendor, client, partner, etc.
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
});

export const clauses = pgTable('clauses', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id)
    .notNull(),
  clauseText: text('clause_text').notNull(),
  clauseDescription: varchar('clause_description'),
  riskLevel: varchar('risk_level'),
  createdBy: varchar('created_by').references(() => user.id),
  updatedBy: varchar('updated_by').references(() => user.id),
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).notNull(),
});

export const alerts = pgTable('alerts', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id)
    .notNull(),
  message: text('message').notNull(),
  priority: varchar('priority').notNull(),
  isRead: boolean('is_read')
    .$defaultFn(() => false)
    .notNull(),
  createdBy: varchar('created_by').references(() => user.id),
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
});

// Types
export type Contract = typeof contracts.$inferSelect;
export type ContractInsert = typeof contracts.$inferInsert;

export type ContractVersion = typeof contractVersions.$inferSelect;
export type ContractVersionInsert = typeof contractVersions.$inferInsert;

export type ContractParty = typeof contractParties.$inferSelect;
export type ContractPartyInsert = typeof contractParties.$inferInsert;

export type Clause = typeof clauses.$inferSelect;
export type ClauseInsert = typeof clauses.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type AlertInsert = typeof alerts.$inferInsert;
