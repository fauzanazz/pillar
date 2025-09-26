ALTER TABLE "clauses" RENAME COLUMN "clause_type" TO "clause_description";--> statement-breakpoint
ALTER TABLE "clauses" DROP COLUMN IF EXISTS "ai_generated";--> statement-breakpoint
ALTER TABLE "clauses" DROP COLUMN IF EXISTS "approved";