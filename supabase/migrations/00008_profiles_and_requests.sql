-- Migration: Create profiles and contact_requests tables
-- Run this in your Supabase SQL editor

-- ═══════ PROFILES TABLE ═══════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  age TEXT,
  area TEXT,
  occupation TEXT,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say') OR gender IS NULL),
  budget TEXT,
  about TEXT,
  food_preference TEXT CHECK (food_preference IN ('Veg', 'Non-Veg', 'Eggetarian', 'Vegan') OR food_preference IS NULL),
  smoking TEXT,
  drinking TEXT,
  sleep_schedule TEXT,
  pet_friendly TEXT,
  cleanliness TEXT,
  interests TEXT[] DEFAULT '{}',
  looking_for TEXT[] DEFAULT '{}',
  move_in_date TEXT,
  whatsapp_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ═══════ CONTACT REQUESTS TABLE ═══════
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contact_requests_owner ON contact_requests (owner_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_requester ON contact_requests (requester_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_listing ON contact_requests (listing_id);

-- RLS for contact_requests
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests (sent or received)" ON contact_requests;
DROP POLICY IF EXISTS "Authenticated users can create requests" ON contact_requests;
DROP POLICY IF EXISTS "Listing owners can update request status" ON contact_requests;

CREATE POLICY "Users can view own requests (sent or received)"
  ON contact_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create requests"
  ON contact_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Listing owners can update request status"
  ON contact_requests FOR UPDATE
  USING (auth.uid() = owner_id);

-- Add user_id column to user_listings if not exists (for linking to profiles)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_listings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE user_listings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;
