CREATE TYPE "public"."asset_type" AS ENUM('residential', 'commercial', 'industrial', 'vehicle', 'machinery', 'gold', 'land');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'contacted', 'qualified', 'closed');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'pending_review', 'published', 'auction_live', 'sold', 'withdrawn', 'expired');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('sarfaesi', 'liquidation', 'drt', 'private_treaty');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('buyer', 'seller', 'bank_officer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending_verification', 'active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"ip_address" varchar(45),
	"user_agent" varchar(512),
	"expires_at" timestamp with time zone NOT NULL,
	"absolute_expires_at" timestamp with time zone NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"email_normalized" varchar(320) NOT NULL,
	"email_verified_at" timestamp with time zone,
	"password_hash" text NOT NULL,
	"password_algo_version" integer DEFAULT 1 NOT NULL,
	"password_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"phone" varchar(20),
	"phone_verified_at" timestamp with time zone,
	"role" "user_role" DEFAULT 'buyer' NOT NULL,
	"status" "user_status" DEFAULT 'pending_verification' NOT NULL,
	"failed_login_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"accepted_terms_at" timestamp with time zone,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_format_check" CHECK ("users"."email_normalized" ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
	CONSTRAINT "users_failed_login_count_check" CHECK ("users"."failed_login_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" varchar(32) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"short_name" varchar(40),
	"logo_url" varchar(500),
	"listing_count" integer DEFAULT 0 NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"icon_key" varchar(40) NOT NULL,
	"listing_count" integer DEFAULT 0 NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"state" varchar(80) NOT NULL,
	"listing_count" integer DEFAULT 0 NOT NULL,
	"is_popular" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(200) NOT NULL,
	"excerpt" varchar(400),
	"body" text,
	"cover_image_url" varchar(500),
	"read_minutes" smallint DEFAULT 4 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"user_id" uuid,
	"full_name" varchar(120) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"message" text,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"alt" varchar(200),
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_no" varchar(32) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"asset_type" "asset_type" NOT NULL,
	"sale_type" "sale_type" DEFAULT 'sarfaesi' NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"category_id" uuid,
	"bank_id" uuid NOT NULL,
	"city_id" uuid NOT NULL,
	"address_line" varchar(300),
	"locality" varchar(120),
	"pincode" varchar(6),
	"area_sqft" integer,
	"reserve_price_paise" bigint NOT NULL,
	"emd_amount_paise" bigint NOT NULL,
	"emd_due_at" timestamp with time zone,
	"auction_starts_at" timestamp with time zone,
	"auction_ends_at" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_by_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "listings_reserve_price_positive" CHECK ("listings"."reserve_price_paise" > 0),
	CONSTRAINT "listings_emd_non_negative" CHECK ("listings"."emd_amount_paise" >= 0),
	CONSTRAINT "listings_area_positive" CHECK ("listings"."area_sqft" is null or "listings"."area_sqft" > 0),
	CONSTRAINT "listings_pincode_format" CHECK ("listings"."pincode" is null or "listings"."pincode" ~ '^[1-9][0-9]{5}$'),
	CONSTRAINT "listings_auction_window_ordered" CHECK ("listings"."auction_ends_at" is null or "listings"."auction_starts_at" is null or "listings"."auction_ends_at" > "listings"."auction_starts_at")
);
--> statement-breakpoint
CREATE TABLE "watchlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"actor_role" varchar(32),
	"action" varchar(64) NOT NULL,
	"outcome" varchar(16) DEFAULT 'success' NOT NULL,
	"entity_type" varchar(64),
	"entity_id" varchar(64),
	"ip_address" varchar(45),
	"user_agent" varchar(512),
	"request_id" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit_counters" (
	"key" varchar(128) PRIMARY KEY NOT NULL,
	"count" varchar(16) DEFAULT '0' NOT NULL,
	"window_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users" USING btree ("email_normalized");--> statement-breakpoint
CREATE INDEX "users_role_status_idx" ON "users" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tokens_hash_key" ON "verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "verification_tokens_user_purpose_idx" ON "verification_tokens" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "banks_slug_key" ON "banks" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "banks_display_order_idx" ON "banks" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_key" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cities_state_idx" ON "cities" USING btree ("state");--> statement-breakpoint
CREATE INDEX "cities_listing_count_idx" ON "cities" USING btree ("listing_count" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_key" ON "articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "articles_published_at_idx" ON "articles" USING btree ("published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "enquiries_listing_idx" ON "enquiries" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "enquiries_status_created_idx" ON "enquiries" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "listing_images_listing_position_idx" ON "listing_images" USING btree ("listing_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_reference_no_key" ON "listings" USING btree ("reference_no");--> statement-breakpoint
CREATE UNIQUE INDEX "listings_slug_key" ON "listings" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "listings_status_published_at_idx" ON "listings" USING btree ("status","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "listings_city_status_idx" ON "listings" USING btree ("city_id","status");--> statement-breakpoint
CREATE INDEX "listings_bank_status_idx" ON "listings" USING btree ("bank_id","status");--> statement-breakpoint
CREATE INDEX "listings_category_status_idx" ON "listings" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "listings_featured_idx" ON "listings" USING btree ("is_featured","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "listings_auction_starts_idx" ON "listings" USING btree ("auction_starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_user_listing_key" ON "watchlist_items" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "watchlist_user_idx" ON "watchlist_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_created_idx" ON "audit_logs" USING btree ("actor_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_action_created_idx" ON "audit_logs" USING btree ("action","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "rate_limit_expires_idx" ON "rate_limit_counters" USING btree ("expires_at");