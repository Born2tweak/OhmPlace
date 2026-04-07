-- Add campus column to listings for campus-scoped filtering
ALTER TABLE listings ADD COLUMN IF NOT EXISTS campus TEXT;

-- Backfill existing listings from seller profiles
UPDATE listings
SET campus = profiles.campus
FROM profiles
WHERE listings.user_id = profiles.id
  AND profiles.campus IS NOT NULL;

-- Index for filtering performance
CREATE INDEX IF NOT EXISTS idx_listings_campus ON listings(campus);
