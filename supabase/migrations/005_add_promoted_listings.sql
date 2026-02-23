-- Add promoted listing columns
ALTER TABLE listings ADD COLUMN promoted BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN promoted_until TIMESTAMPTZ;

-- Index for sorting promoted listings first
CREATE INDEX idx_listings_promoted ON listings(promoted, promoted_until DESC);
