-- Phone OTPs table for WhatsApp verification
CREATE TABLE IF NOT EXISTS phone_otps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_phone_otps_phone ON phone_otps (phone);

-- Auto-clean expired OTPs (optional cron, or just delete on verify)
-- RLS: only service role can access this table
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role (admin) can access
