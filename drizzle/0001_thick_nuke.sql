ALTER TABLE "patient" ADD COLUMN "contact_number" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "email" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "address" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD COLUMN "role_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;