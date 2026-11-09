DO $$ BEGIN
 CREATE TYPE "public"."coverage_type" AS ENUM('comprehensive', 'third_party');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE TYPE "public"."item_action" AS ENUM('replace', 'repair'); 
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE TYPE "public"."item_condition" AS ENUM('new', 'used');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
CREATE TYPE "public"."item_origin" AS ENUM('genuine', 'local');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
CREATE TYPE "public"."part_source" AS ENUM('excel_import', 'admin', 'promoted_custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
CREATE TYPE "public"."report_status" AS ENUM('draft', 'finalized', 'void');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
CREATE TYPE "public"."user_role" AS ENUM('admin', 'supervisor', 'surveyor');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE TABLE "audit_log" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" uuid,
	"actor_email" text,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"changes" jsonb,
	"diff" jsonb,
	"row_pk" jsonb,
	"request_id" text
); EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE TABLE "branches" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "branches_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"names" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
CREATE TABLE "languages" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"native_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
CREATE TABLE "part_translations" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "part_translations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"part_id" uuid NOT NULL,
	"lang" text NOT NULL,
	"name" text NOT NULL,
	"name_norm" text GENERATED ALWAYS AS (fold_text(name)) STORED
); EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
CREATE TABLE "parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"source" "part_source" DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"search_text" text DEFAULT '' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parts_code_unique" UNIQUE("code")
); EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
CREATE TABLE "report_counters" (
	"branch_id" integer NOT NULL,
	"year" integer NOT NULL,
	"last_no" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "report_counters_branch_id_year_pk" PRIMARY KEY("branch_id","year")
); EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
CREATE TABLE "report_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"action" "item_action" NOT NULL,
	"position" integer NOT NULL,
	"part_id" uuid,
	"names" jsonb NOT NULL,
	"is_recovery" boolean DEFAULT false NOT NULL,
	"condition" "item_condition",
	"origin" "item_origin",
	"quantity" smallint DEFAULT 1 NOT NULL,
	"remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
); EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
CREATE TABLE "survey_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_no" text,
	"claim_ref" text,
	"status" "report_status" DEFAULT 'draft' NOT NULL,
	"branch_id" integer NOT NULL,
	"surveyor_id" uuid NOT NULL,
	"coverage" "coverage_type",
	"report_date" date DEFAULT CURRENT_DATE NOT NULL,
	"vehicle_type" text,
	"plate_no" text,
	"manufacture_year" smallint,
	"engine_no" text,
	"chassis_no" text,
	"model" text,
	"print_lang" text DEFAULT 'am' NOT NULL,
	"remarks" text,
	"revision_of" uuid,
	"revision_no" integer DEFAULT 0 NOT NULL,
	"finalized_at" timestamp with time zone,
	"finalized_by" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "survey_reports_report_no_unique" UNIQUE("report_no")
); EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"role" varchar(20) DEFAULT 'surveyor' NOT NULL,
	"branch_id" integer,
	"preferred_lang" varchar(10) DEFAULT 'am' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
); EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "part_translations" ADD CONSTRAINT "part_translations_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "part_translations" ADD CONSTRAINT "part_translations_lang_languages_code_fk" FOREIGN KEY ("lang") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_counters" ADD CONSTRAINT "report_counters_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_items" ADD CONSTRAINT "report_items_report_id_survey_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."survey_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_items" ADD CONSTRAINT "report_items_part_id_parts_id_fk" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_reports" ADD CONSTRAINT "survey_reports_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_reports" ADD CONSTRAINT "survey_reports_surveyor_id_users_id_fk" FOREIGN KEY ("surveyor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_reports" ADD CONSTRAINT "survey_reports_print_lang_languages_code_fk" FOREIGN KEY ("print_lang") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_reports" ADD CONSTRAINT "survey_reports_finalized_by_users_id_fk" FOREIGN KEY ("finalized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_log" USING btree ("entity","entity_id","at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "part_translations_part_id_lang_key" ON "part_translations" USING btree ("part_id","lang");--> statement-breakpoint
CREATE INDEX "part_translations_lang_idx" ON "part_translations" USING btree ("lang");--> statement-breakpoint
CREATE UNIQUE INDEX "items_position_uq" ON "report_items" USING btree ("report_id","action","position");--> statement-breakpoint
CREATE INDEX "report_items_part_idx" ON "report_items" USING btree ("part_id");--> statement-breakpoint
CREATE INDEX "reports_branch_date_idx" ON "survey_reports" USING btree ("branch_id","report_date");--> statement-breakpoint
CREATE INDEX "reports_surveyor_idx" ON "survey_reports" USING btree ("surveyor_id","status");--> statement-breakpoint
CREATE INDEX "reports_plate_idx" ON "survey_reports" USING btree (upper("plate_no"));--> statement-breakpoint
CREATE INDEX "reports_chassis_idx" ON "survey_reports" USING btree (upper("chassis_no"));