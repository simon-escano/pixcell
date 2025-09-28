CREATE TYPE "public"."report_status" AS ENUM('Draft', 'Finalized', 'UNDER_REVIEW', 'REJECTED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "doctor_patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"order_no" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "annotation" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "note" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "test_sample" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "annotation" CASCADE;--> statement-breakpoint
DROP TABLE "note" CASCADE;--> statement-breakpoint
DROP TABLE "test_sample" CASCADE;--> statement-breakpoint
ALTER TABLE "patient" DROP CONSTRAINT "patient_note_id_unique";--> statement-breakpoint
ALTER TABLE "patient" DROP CONSTRAINT "patient_note_id_note_id_fk";
--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "content" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "export_format" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "license_no" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "patient_id" uuid;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "test_type" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "status" "report_status";--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "sample" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "sample_image" ADD COLUMN "is_ai_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "doctor_patient" ADD CONSTRAINT "doctor_patient_doctor_id_profile_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_patient" ADD CONSTRAINT "doctor_patient_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_created_by_profile_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN "note_id";