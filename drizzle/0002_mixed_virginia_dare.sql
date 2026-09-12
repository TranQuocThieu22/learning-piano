CREATE TABLE "lesson_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"lesson_slug" text NOT NULL,
	"verdict" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_feedback" ADD CONSTRAINT "lesson_feedback_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_feedback_user_lesson_idx" ON "lesson_feedback" USING btree ("userId","lesson_slug");