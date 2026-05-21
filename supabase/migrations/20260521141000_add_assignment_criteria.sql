ALTER TABLE "public"."business_settings"
ADD COLUMN IF NOT EXISTS "assignment_criteria" text DEFAULT 'random';
