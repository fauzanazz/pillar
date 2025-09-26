ALTER TABLE "clauses" DROP CONSTRAINT "clauses_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "clauses" DROP CONSTRAINT "clauses_updated_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contract_versions" DROP CONSTRAINT "contract_versions_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contract_versions" DROP CONSTRAINT "contract_versions_updated_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_created_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_updated_by_user_id_fk";
--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "contracts" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;