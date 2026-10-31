-- Fix category constraint to match new categories (FURNITURE, ROOMMATE)
-- Also allow the dev user_id to work by making user_id nullable in dev

-- Drop and recreate the category check constraint
ALTER TABLE user_listings DROP CONSTRAINT IF EXISTS user_listings_category_check;
ALTER TABLE user_listings ADD CONSTRAINT user_listings_category_check
  CHECK (category IN ('FURNITURE', 'ROOMMATE'));

-- Update any old categories to ROOMMATE
UPDATE user_listings SET category = 'ROOMMATE' WHERE category IN ('ROOM', 'FLATMATE', 'REPLACEMENT');

-- Make user_id not reference auth.users strictly (allow dev usage)
ALTER TABLE user_listings DROP CONSTRAINT IF EXISTS user_listings_user_id_fkey;
ALTER TABLE user_listings ALTER COLUMN user_id DROP NOT NULL;

-- Allow anyone (including anon) to read listings
DROP POLICY IF EXISTS "Anyone can view listings" ON user_listings;
CREATE POLICY "Anyone can view listings"
  ON user_listings FOR SELECT
  USING (true);

-- Allow anyone to insert listings (for dev mode; tighten in production)
DROP POLICY IF EXISTS "Users can create own listings" ON user_listings;
CREATE POLICY "Anyone can create listings"
  ON user_listings FOR INSERT
  WITH CHECK (true);
