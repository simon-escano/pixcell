ALTER TABLE "ai_analysis" DROP CONSTRAINT "ai_analysis_sample_id_sample_id_fk";
--> statement-breakpoint
ALTER TABLE "annotation" DROP CONSTRAINT "annotation_sample_id_sample_id_fk";
--> statement-breakpoint
ALTER TABLE "report" DROP CONSTRAINT "report_sample_id_sample_id_fk";
--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "contact_number" varchar;--> statement-breakpoint
ALTER TABLE "auth"."users" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_sample_id_sample_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."sample"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation" ADD CONSTRAINT "annotation_sample_id_sample_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."sample"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_sample_id_sample_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."sample"("id") ON DELETE cascade ON UPDATE no action;