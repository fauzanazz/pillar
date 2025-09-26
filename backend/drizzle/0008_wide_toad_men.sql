CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh_key" text NOT NULL,
	"auth_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_user_id_endpoint_unique" UNIQUE("user_id","endpoint")
);
