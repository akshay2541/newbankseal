CREATE TYPE "public"."nearby_category" AS ENUM('connectivity', 'hospital', 'school', 'restaurant', 'banking');--> statement-breakpoint
CREATE TABLE "listing_nearby_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"category" "nearby_category" NOT NULL,
	"name" varchar(160) NOT NULL,
	"distance_km" numeric(6, 2) NOT NULL,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"position" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "listing_nearby_distance_positive" CHECK ("listing_nearby_places"."distance_km" >= 0)
);
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "latitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "longitude" numeric(9, 6);--> statement-breakpoint
ALTER TABLE "listing_nearby_places" ADD CONSTRAINT "listing_nearby_places_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listing_nearby_listing_category_idx" ON "listing_nearby_places" USING btree ("listing_id","category","position");--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_latitude_range" CHECK ("listings"."latitude" is null or ("listings"."latitude" between -90 and 90));--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_longitude_range" CHECK ("listings"."longitude" is null or ("listings"."longitude" between -180 and 180));