ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "ai_draft_data" json;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "ai_metadata" json;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "draft_summary" text;