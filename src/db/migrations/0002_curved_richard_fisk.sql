CREATE TYPE "public"."area_unit" AS ENUM('sqft', 'sqyd', 'sqm', 'acre', 'hectare');--> statement-breakpoint
ALTER TYPE "public"."possession_type" ADD VALUE 'constructive';--> statement-breakpoint
ALTER TABLE "banks" ADD COLUMN "contact_name" varchar(120);--> statement-breakpoint
ALTER TABLE "banks" ADD COLUMN "contact_phone" varchar(20);--> statement-breakpoint
ALTER TABLE "banks" ADD COLUMN "contact_email" varchar(320);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "area_value" numeric(12, 3);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "area_unit" "area_unit";--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "building_name" varchar(160);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "borrower_name" varchar(160);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "bid_increment_paise" bigint;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_area_value_positive" CHECK ("listings"."area_value" is null or "listings"."area_value" > 0);--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_bid_increment_positive" CHECK ("listings"."bid_increment_paise" is null or "listings"."bid_increment_paise" > 0);