-- ============================================================================
-- MoveMate: Full-Text Search & Performance Indexes
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Full-Text Search Column (GIN-indexed tsvector)
-- ----------------------------------------------------------------------------

-- Add generated tsvector column combining title, description, and location
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS fts tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(location, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C')
) STORED;

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_listings_fts ON listings USING GIN (fts);

-- ----------------------------------------------------------------------------
-- 2. Performance Indexes for Filtering & Sorting
-- ----------------------------------------------------------------------------

-- Composite index for the most common query pattern: active listings sorted by date
CREATE INDEX IF NOT EXISTS idx_listings_active_created
  ON listings (status, created_at DESC)
  WHERE status = 'active';

-- Composite index for category filtering (furniture)
CREATE INDEX IF NOT EXISTS idx_listings_category_price
  ON listings (category, price)
  WHERE status = 'active' AND listing_type = 'furniture';

-- Composite index for room/flatmate filtering
CREATE INDEX IF NOT EXISTS idx_listings_type_rent
  ON listings (listing_type, rent_per_week)
  WHERE status = 'active';

-- Price index for range queries
CREATE INDEX IF NOT EXISTS idx_listings_price
  ON listings (price)
  WHERE status = 'active';

-- Location trigram index for ILIKE pattern matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_listings_location_trgm
  ON listings USING GIN (location gin_trgm_ops);

-- Listing type index
CREATE INDEX IF NOT EXISTS idx_listings_type_status
  ON listings (listing_type, status);
