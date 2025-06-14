CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"overall_experience" integer,
	"interface_usability" integer,
	"ai_accuracy" integer,
	"ai_usability" integer,
	"collaboration_tools" integer,
	"collaboration_issues" integer,
	"feature_suggestions" text,
	"technical_issues" text,
	"recommendation" integer,
	"additional_comments" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;