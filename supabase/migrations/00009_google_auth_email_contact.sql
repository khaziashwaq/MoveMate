-- ============================================================================
-- MoveMate: Google (Gmail) auth replaces phone auth; buyers email sellers once
-- ============================================================================

-- A buyer can email a seller only once per listing.
-- Remove any existing duplicates first so the unique index can be created.
DELETE FROM contact_requests a
  USING contact_requests b
  WHERE a.requester_id = b.requester_id
    AND a.listing_id = b.listing_id
    AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_requests_requester_listing
  ON contact_requests (requester_id, listing_id);

-- Phone OTP login is gone.
DROP TABLE IF EXISTS phone_otps;
