-- ============================================================================
-- MoveMate: Initial Schema Migration
-- ============================================================================
-- Tables: profiles, listings, listing_images, saved_listings, reports
-- Auth: Supabase Auth (auth.users) is the source of truth for user identity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ----------------------------------------------------------------------------
-- 1. Custom Types (Enums)
-- ----------------------------------------------------------------------------

CREATE TYPE listing_status AS ENUM (
  'draft',
  'active',
  'sold',
  'reserved',
  'expired',
  'removed'
);

CREATE TYPE listing_category AS ENUM (
  'sofa',
  'bed',
  'table',
  'chair',
  'desk',
  'storage',
  'lighting',
  'appliance',
  'decor',
  'outdoor',
  'other'
);

CREATE TYPE listing_condition AS ENUM (
  'new',
  'like_new',
  'good',
  'fair',
  'poor'
);

CREATE TYPE report_reason AS ENUM (
  'spam',
  'scam',
  'inappropriate_content',
  'misleading',
  'duplicate',
  'prohibited_item',
  'harassment',
  'other'
);

CREATE TYPE report_status AS ENUM (
  'pending',
  'reviewing',
  'resolved',
  'dismissed'
);

CREATE TYPE report_target_type AS ENUM (
  'listing',
  'profile'
);

-- ----------------------------------------------------------------------------
-- 2. Profiles
-- ----------------------------------------------------------------------------
-- Extends auth.users with public profile data.
-- Created automatically via trigger on auth.users INSERT.
-- ----------------------------------------------------------------------------

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL DEFAULT '',
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT DEFAULT '' CHECK (char_length(bio) <= 500),
  phone         TEXT CHECK (phone ~ '^\+?[0-9\s\-()]{7,20}$' OR phone IS NULL),
  location      TEXT,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Public user profiles, extends auth.users';
COMMENT ON COLUMN profiles.id IS 'References auth.users.id, set on registration';
COMMENT ON COLUMN profiles.phone IS 'E.164 format preferred, shown only to matched users';

-- Indexes
CREATE INDEX idx_profiles_display_name ON profiles (display_name);
CREATE INDEX idx_profiles_location ON profiles (location);
CREATE INDEX idx_profiles_created_at ON profiles (created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ----------------------------------------------------------------------------
-- 3. Listings
-- ----------------------------------------------------------------------------
-- Furniture marketplace listings (buy/sell).
-- ----------------------------------------------------------------------------

CREATE TABLE listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description   TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  price         INTEGER NOT NULL CHECK (price >= 0 AND price <= 10000000),
  currency      TEXT NOT NULL DEFAULT 'AUD' CHECK (currency ~ '^[A-Z]{3}$'),
  category      listing_category NOT NULL,
  condition     listing_condition NOT NULL,
  status        listing_status NOT NULL DEFAULT 'active',
  location      TEXT NOT NULL,
  latitude      DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
  longitude     DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
  is_negotiable BOOLEAN NOT NULL DEFAULT FALSE,
  is_delivery   BOOLEAN NOT NULL DEFAULT FALSE,
  view_count    INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  expires_at    TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE listings IS 'Furniture marketplace listings';
COMMENT ON COLUMN listings.price IS 'Price in smallest currency unit (cents)';
COMMENT ON COLUMN listings.expires_at IS 'Auto-expire after 30 days, renewable';

-- Indexes
CREATE INDEX idx_listings_seller_id ON listings (seller_id);
CREATE INDEX idx_listings_status ON listings (status) WHERE status = 'active';
CREATE INDEX idx_listings_category ON listings (category);
CREATE INDEX idx_listings_condition ON listings (condition);
CREATE INDEX idx_listings_location ON listings (location);
CREATE INDEX idx_listings_price ON listings (price);
CREATE INDEX idx_listings_created_at ON listings (created_at DESC);
CREATE INDEX idx_listings_expires_at ON listings (expires_at) WHERE status = 'active';

-- Composite indexes for common filter combinations
CREATE INDEX idx_listings_active_category_price
  ON listings (category, price)
  WHERE status = 'active';

CREATE INDEX idx_listings_active_location_category
  ON listings (location, category)
  WHERE status = 'active';

-- Full-text search index
ALTER TABLE listings ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX idx_listings_fts ON listings USING gin(fts);

-- Auto-update updated_at
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ----------------------------------------------------------------------------
-- 4. Listing Images
-- ----------------------------------------------------------------------------
-- Separate table for listing images (1-to-many, ordered).
-- ----------------------------------------------------------------------------

CREATE TABLE listing_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url         TEXT NOT NULL CHECK (url ~ '^https?://'),
  storage_path TEXT NOT NULL,
  position    SMALLINT NOT NULL DEFAULT 0 CHECK (position >= 0 AND position < 10),
  width       INTEGER CHECK (width > 0),
  height      INTEGER CHECK (height > 0),
  size_bytes  INTEGER CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure unique ordering per listing
  CONSTRAINT unique_listing_image_position UNIQUE (listing_id, position)
);

COMMENT ON TABLE listing_images IS 'Images associated with a listing, max 10 per listing';
COMMENT ON COLUMN listing_images.position IS '0-indexed display order, 0 = primary/cover image';
COMMENT ON COLUMN listing_images.storage_path IS 'Supabase Storage path for deletion';
COMMENT ON COLUMN listing_images.size_bytes IS 'Max 5MB (5,242,880 bytes)';

-- Indexes
CREATE INDEX idx_listing_images_listing_id ON listing_images (listing_id);
CREATE INDEX idx_listing_images_position ON listing_images (listing_id, position);

-- ----------------------------------------------------------------------------
-- 5. Saved Listings (Favorites/Bookmarks)
-- ----------------------------------------------------------------------------
-- Users can save listings they're interested in.
-- ----------------------------------------------------------------------------

CREATE TABLE saved_listings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate saves
  CONSTRAINT unique_user_listing_save UNIQUE (user_id, listing_id)
);

COMMENT ON TABLE saved_listings IS 'User bookmarked/favorited listings';

-- Indexes
CREATE INDEX idx_saved_listings_user_id ON saved_listings (user_id);
CREATE INDEX idx_saved_listings_listing_id ON saved_listings (listing_id);
CREATE INDEX idx_saved_listings_created_at ON saved_listings (user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. Reports
-- ----------------------------------------------------------------------------
-- Users can report listings or profiles for moderation.
-- ----------------------------------------------------------------------------

CREATE TABLE reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type   report_target_type NOT NULL,
  target_id     UUID NOT NULL,
  reason        report_reason NOT NULL,
  description   TEXT CHECK (char_length(description) <= 2000),
  status        report_status NOT NULL DEFAULT 'pending',
  moderator_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate reports from same user on same target
  CONSTRAINT unique_reporter_target UNIQUE (reporter_id, target_type, target_id)
);

COMMENT ON TABLE reports IS 'User-submitted reports for moderation review';
COMMENT ON COLUMN reports.target_id IS 'UUID of the reported listing or profile';
COMMENT ON COLUMN reports.moderator_id IS 'Admin who handled the report';

-- Indexes
CREATE INDEX idx_reports_reporter_id ON reports (reporter_id);
CREATE INDEX idx_reports_target ON reports (target_type, target_id);
CREATE INDEX idx_reports_status ON reports (status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX idx_reports_created_at ON reports (created_at DESC);

-- Auto-update updated_at
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ----------------------------------------------------------------------------
-- 7. Functions
-- ----------------------------------------------------------------------------

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger: Create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function: Increment listing view count (called via RPC)
CREATE OR REPLACE FUNCTION increment_view_count(listing_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.listings
  SET view_count = view_count + 1
  WHERE id = listing_uuid
    AND status = 'active';
END;
$$;

-- Function: Get listing save count
CREATE OR REPLACE FUNCTION get_listing_save_count(listing_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.saved_listings
  WHERE listing_id = listing_uuid;
$$;

-- ============================================================================
-- 8. Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------------
-- 8.1 Profiles Policies
-- --------------------------------------------------------------------------

-- Anyone can view profiles (public data)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profiles are created via trigger (no direct insert by users)
CREATE POLICY "Profiles are created by system trigger"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------------
-- 8.2 Listings Policies
-- --------------------------------------------------------------------------

-- Active listings are viewable by everyone (public marketplace)
CREATE POLICY "Active listings are viewable by everyone"
  ON listings FOR SELECT
  USING (
    status = 'active'
    OR seller_id = auth.uid()  -- Sellers can always see their own
  );

-- Authenticated users can create listings
CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  WITH CHECK (
    auth.uid() = seller_id
    AND auth.uid() IS NOT NULL
  );

-- Sellers can update their own listings
CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can delete their own listings
CREATE POLICY "Sellers can delete own listings"
  ON listings FOR DELETE
  USING (auth.uid() = seller_id);

-- --------------------------------------------------------------------------
-- 8.3 Listing Images Policies
-- --------------------------------------------------------------------------

-- Images are viewable if the listing is viewable
CREATE POLICY "Listing images are viewable with listing"
  ON listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
        AND (listings.status = 'active' OR listings.seller_id = auth.uid())
    )
  );

-- Sellers can add images to their own listings
CREATE POLICY "Sellers can add images to own listings"
  ON listing_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
        AND listings.seller_id = auth.uid()
    )
  );

-- Sellers can update image metadata on their own listings
CREATE POLICY "Sellers can update images on own listings"
  ON listing_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
        AND listings.seller_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
        AND listings.seller_id = auth.uid()
    )
  );

-- Sellers can delete images from their own listings
CREATE POLICY "Sellers can delete images from own listings"
  ON listing_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_images.listing_id
        AND listings.seller_id = auth.uid()
    )
  );

-- --------------------------------------------------------------------------
-- 8.4 Saved Listings Policies
-- --------------------------------------------------------------------------

-- Users can only see their own saved listings
CREATE POLICY "Users can view own saved listings"
  ON saved_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can save listings
CREATE POLICY "Users can save listings"
  ON saved_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own saved listings
CREATE POLICY "Users can unsave own saved listings"
  ON saved_listings FOR DELETE
  USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- 8.5 Reports Policies
-- --------------------------------------------------------------------------

-- Users can only view their own reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Authenticated users can create reports
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (
    auth.uid() = reporter_id
    AND auth.uid() IS NOT NULL
  );

-- Users cannot update or delete reports (admin only via service role)
-- No UPDATE/DELETE policies for regular users

-- ============================================================================
-- 9. Storage Bucket Policies (run in Supabase Dashboard or via SQL)
-- ============================================================================

-- NOTE: Storage bucket creation requires the Supabase Storage API.
-- These INSERT statements create the buckets if run via Supabase SQL Editor:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('listings', 'listings', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: listings bucket
CREATE POLICY "Public read access for listings bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listings');

CREATE POLICY "Authenticated users upload to own folder in listings"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listings'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files in listings bucket"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: avatars bucket
CREATE POLICY "Public read access for avatars bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
