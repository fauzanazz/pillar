CREATE TYPE "public"."user_role" AS ENUM('internal', 'legal', 'management');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'internal' NOT NULL;