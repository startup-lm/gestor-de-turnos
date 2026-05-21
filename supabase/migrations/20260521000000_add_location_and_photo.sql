ALTER TABLE "public"."business_settings"
ADD COLUMN IF NOT EXISTS "location_address" text,
ADD COLUMN IF NOT EXISTS "local_photo" text;
