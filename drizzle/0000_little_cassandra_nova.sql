CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"role" text DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "lesson_completion" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"lesson_slug" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlement" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"package_id" text NOT NULL,
	"source" text NOT NULL,
	"order_id" text,
	"note" text,
	"granted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_order" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"package_id" text NOT NULL,
	"amount_vnd" integer NOT NULL,
	"transfer_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_received" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_tx_id" text NOT NULL,
	"order_id" text,
	"amount_vnd" integer NOT NULL,
	"raw_content" text,
	"raw_payload" jsonb,
	"received_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_completion" ADD CONSTRAINT "lesson_completion_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement" ADD CONSTRAINT "entitlement_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlement" ADD CONSTRAINT "entitlement_order_id_payment_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payment_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_order" ADD CONSTRAINT "payment_order_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_received" ADD CONSTRAINT "payment_received_order_id_payment_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."payment_order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_completion_user_lesson_idx" ON "lesson_completion" USING btree ("userId","lesson_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlement_user_package_idx" ON "entitlement" USING btree ("userId","package_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_order_transfer_code_idx" ON "payment_order" USING btree ("transfer_code");--> statement-breakpoint
CREATE INDEX "payment_order_user_idx" ON "payment_order" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_received_provider_tx_idx" ON "payment_received" USING btree ("provider_tx_id");