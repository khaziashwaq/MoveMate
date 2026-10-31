-- ============================================================================
-- MoveMate: Add listing_type enum for multi-type listings
-- ============================================================================
-- Listing Types:
--   furniture         - Furniture for sale
--   flatmate_wanted   - Looking for a flatmate
--   flatmate_replacement - Replacing yourself in a lease
--   room_available    - Room available for rent
-- ============================================================================

-- Add listing_type enum
CREATE TYPE listing_type AS ENUM (
  'furniture',
  'flatmate_wanted',
  'flatmate_replacement',
  'room_available'
);

-- Add listing_type column to listings (default to furniture for backward compat)
ALTER TABLE listings
  ADD COLUMN listing_type listing_type NOT NULL DEFAULT 'furniture';

-- Add room/flatmate-specific fields (nullable, only relevant for certain types)
ALTER TABLE listings
  ADD COLUMN rent_per_week INTEGER CHECK (rent_per_week IS NULL OR (rent_per_week >= 0 AND rent_per_week <= 50000)),
  ADD COLUMN bond INTEGER CHECK (bond IS NULL OR (bond >= 0 AND bond <= 500000)),
  ADD COLUMN available_from DATE,
  ADD COLUMN lease_end DATE,
  ADD COLUMN room_type TEXT CHECK (room_type IN ('private', 'shared', NULL)),
  ADD COLUMN preferred_gender TEXT CHECK (preferred_gender IN ('any', 'male', 'female', 'non_binary', NULL)),
  ADD COLUMN current_occupants SMALLINT CHECK (current_occupants IS NULL OR (current_occupants >= 0 AND current_occupants <= 20)),
  ADD COLUMN total_rooms SMALLINT CHECK (total_rooms IS NULL OR (total_rooms >= 1 AND total_rooms <= 20)),
  ADD COLUMN furnished BOOLEAN,
  ADD COLUMN bills_included BOOLEAN,
  ADD COLUMN parking BOOLEAN,
  ADD COLUMN pets_allowed BOOLEAN;

-- Add index on listing_type for filtered queries
CREATE INDEX idx_listings_listing_type ON listings (listing_type);

-- Composite index: type + status for most common query pattern
CREATE INDEX idx_listings_type_status_created
  ON listings (listing_type, status, created_at DESC)
  WHERE status = 'active';
