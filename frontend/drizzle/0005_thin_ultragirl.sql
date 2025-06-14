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
CREATE TABLE "image" (
	"id" uuid PRIMARY KEY NOT NULL,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "note" (
	"id" uuid PRIMARY KEY NOT NULL,
	"note_content" text
);
--> statement-breakpoint
CREATE TABLE "sample_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sample_id" uuid,
	"profile_id" uuid,
	"metadata" json NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now(),
	"image_id" uuid,
	CONSTRAINT "sample_image_image_id_unique" UNIQUE("image_id")
);
--> statement-breakpoint
ALTER TABLE "ai_analysis" DROP CONSTRAINT "ai_analysis_generated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "annotation" DROP CONSTRAINT "annotation_sample_id_sample_id_fk";
--> statement-breakpoint
ALTER TABLE "annotation" DROP CONSTRAINT "annotation_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sample" DROP CONSTRAINT "sample_uploaded_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "annotation" ADD COLUMN "sample_image_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "annotation" ADD COLUMN "profile_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "image_id" uuid;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "note_id" uuid;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "image_id" uuid;--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_image" ADD CONSTRAINT "sample_image_sample_id_sample_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."sample"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_image" ADD CONSTRAINT "sample_image_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_image" ADD CONSTRAINT "sample_image_image_id_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_generated_by_profile_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_sample_image_id_sample_image_id_fk" FOREIGN KEY ("sample_image_id") REFERENCES "public"."sample_image"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_image_id_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_note_id_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."note"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_image_id_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample" ADD CONSTRAINT "sample_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation" DROP COLUMN "sample_id";--> statement-breakpoint
ALTER TABLE "annotation" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "profile" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "sample" DROP COLUMN "uploaded_by";--> statement-breakpoint
ALTER TABLE "sample" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "sample" DROP COLUMN "captured_at";--> statement-breakpoint
ALTER TABLE "sample" DROP COLUMN "image_url";--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_image_id_unique" UNIQUE("image_id");--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_note_id_unique" UNIQUE("note_id");