CREATE TYPE "public"."possession_type" AS ENUM('physical', 'symbolic');--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "possession_type" "possession_type" DEFAULT 'physical' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "is_reauction" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "previous_reserve_price_paise" bigint;--> statement-breakpoint
CREATE INDEX "listings_status_possession_idx" ON "listings" USING btree ("status","possession_type");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_previous_price_higher" CHECK ("listings"."previous_reserve_price_paise" is null or "listings"."previous_reserve_price_paise" > "listings"."reserve_price_paise");