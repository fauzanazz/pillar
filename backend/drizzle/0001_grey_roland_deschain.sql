ALTER TABLE "contracts" DROP CONSTRAINT "contracts_uploaded_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contracts" ALTER COLUMN "risk_score" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "contracts" DROP COLUMN IF EXISTS "uploaded_by";