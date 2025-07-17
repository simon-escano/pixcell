CREATE TABLE "test_sample" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
