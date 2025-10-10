-- Add care_type column to capture facility vs home service preference
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS care_type text;

-- Backfill existing rows with a sensible default
UPDATE user_sessions
SET care_type = 'facility'
WHERE care_type IS NULL;

-- Constrain allowed values and set default going forward
ALTER TABLE user_sessions
  ALTER COLUMN care_type SET DEFAULT 'facility';

ALTER TABLE user_sessions
  ADD CONSTRAINT user_sessions_care_type_check
  CHECK (care_type IN ('facility', 'home_services', 'both'));

-- Ensure email_subscribed defaults remain consistent
ALTER TABLE user_sessions
  ALTER COLUMN email_subscribed SET DEFAULT false;

-- Index for faster filtering by care type
CREATE INDEX IF NOT EXISTS idx_user_sessions_care_type ON user_sessions(care_type);
