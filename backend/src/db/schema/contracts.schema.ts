import {
  boolean,
  date,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

import { getNow } from '../db-helper';

export const contracts = pgTable('contracts', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  title: varchar('title').notNull(),
  description: text('description'),
  endDate: date('end_date'),
  status: varchar('status').notNull(), // Draft, Legal Review, Management Review, Accepted, Rejected, Canceled
  riskScore: integer('risk_score').default(0),
  reason: text('reason'), // reason for rejection or cancellation
  createdBy: varchar('created_by'),
  updatedBy: varchar('updated_by'),
  deleted: boolean('deleted').default(false).notNull(),
  urlContract: text('url_contract'), // lokasi PDF / file
  // JSON fields for AI-generated data  
  aiDraftData: json('ai_draft_data'), // Complete AI draft response including clauses
  aiMetadata: json('ai_metadata'), // AI processing metadata (correlation_id, model, timestamp, etc.)
  draftSummary: text('draft_summary'), // AI-generated contract summary
  riskData: json('risk_data'), // Risk scan results including contract info and identified risks
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).notNull(),
});

export const contractVersions = pgTable('contract_versions', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id, { onDelete: 'cascade' })
    .notNull(),
  filePath: text('file_path').notNull(),
  versionNo: integer('version_no').notNull(),
  createdBy: varchar('created_by'),
  updatedBy: varchar('updated_by'),
  uploadedAt: timestamp('uploaded_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).notNull(),
});

export const contractParties = pgTable('contract_parties', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id, { onDelete: 'cascade' })
    .notNull(),
  partyName: varchar('party_name').notNull(),
  partyRole: varchar('party_role').notNull(), // vendor, client, partner, etc.
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
});

export const clauses = pgTable('clauses', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id, { onDelete: 'cascade' })
    .notNull(),
  clauseText: text('clause_text').notNull(),
  clauseDescription: varchar('clause_description'),
  riskLevel: varchar('risk_level'),
  createdBy: varchar('created_by'),
  updatedBy: varchar('updated_by'),
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).notNull(),
});

export const alerts = pgTable('alerts', {
  id: integer('id').primaryKey().generatedByDefaultAsIdentity(),
  contractId: integer('contract_id')
    .references(() => contracts.id, { onDelete: 'cascade' })
    .notNull(),
  message: text('message').notNull(),
  priority: varchar('priority').notNull(),
  isRead: boolean('is_read')
    .$defaultFn(() => false)
    .notNull(),
  createdBy: varchar('created_by'),
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
