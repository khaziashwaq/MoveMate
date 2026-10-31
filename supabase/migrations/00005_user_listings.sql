-- ============================================================================
-- MoveMate: User-created listings for the map
-- ============================================================================

CREATE TABLE user_listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('ROOM', 'FLATMATE', 'FURNITURE', 'REPLACEMENT')),
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description   TEXT NOT NULL DEFAULT '',
  address       TEXT NOT NULL,
  landmark      TEXT DEFAULT '',
  rent          TEXT NOT NULL,
  deposit       TEXT DEFAULT '',
  brokerage     TEXT DEFAULT '',
  available_from TEXT DEFAULT '',
  features      TEXT[] NOT NULL DEFAULT '{}',
  flatmate_info TEXT DEFAULT '',
  preferences   TEXT DEFAULT '',
  contact       TEXT DEFAULT '',
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  image_url     TEXT DEFAULT 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=300&fit=crop',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user-specific queries
CREATE INDEX idx_user_listings_user_id ON user_listings (user_id);

-- RLS policies
ALTER TABLE user_listings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all listings
CREATE POLICY "Anyone can view listings"
  ON user_listings FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own listings
CREATE POLICY "Users can create own listings"
  ON user_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON user_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
