CREATE TABLE "user_sheet_page" (
	"id" text PRIMARY KEY NOT NULL,
	"sheet_id" text NOT NULL,
	"userId" text NOT NULL,
	"position" integer NOT NULL,
	"mime_type" text NOT NULL,
	"data_base64" text NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_sheet" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"title" text NOT NULL,
	"kind" text NOT NULL,
	"source" text NOT NULL,
	"abc" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_sheet_page" ADD CONSTRAINT "user_sheet_page_sheet_id_user_sheet_id_fk" FOREIGN KEY ("sheet_id") REFERENCES "public"."user_sheet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sheet_page" ADD CONSTRAINT "user_sheet_page_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sheet" ADD CONSTRAINT "user_sheet_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_sheet_page_sheet_idx" ON "user_sheet_page" USING btree ("sheet_id","position");--> statement-breakpoint
CREATE INDEX "user_sheet_user_idx" ON "user_sheet" USING btree ("userId","created_at");