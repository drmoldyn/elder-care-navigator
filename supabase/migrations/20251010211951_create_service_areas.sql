-- Migration: Create service area tables for home health and hospice agencies
-- These providers serve regions (ZIP codes) rather than being visited by patients

-- Table to store which ZIP codes each home health/hospice agency serves
CREATE TABLE IF NOT EXISTS home_health_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(2) NOT NULL,
  ccn VARCHAR(10) NOT NULL, -- CMS Certification Number
  zip_code VARCHAR(5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_service_areas_ccn ON home_health_service_areas(ccn);
CREATE INDEX IF NOT EXISTS idx_service_areas_zip ON home_health_service_areas(zip_code);
CREATE INDEX IF NOT EXISTS idx_service_areas_state_zip ON home_health_service_areas(state, zip_code);

-- Composite index for fast "which agencies serve this ZIP?" queries
CREATE INDEX IF NOT EXISTS idx_service_areas_lookup ON home_health_service_areas(zip_code, ccn);

-- Add comment explaining the table purpose
COMMENT ON TABLE home_health_service_areas IS 'Maps home health and hospice agencies to the ZIP codes they serve. Used to match users with agencies that cover their area.';

-- Enable Row Level Security (optional, for future multi-tenancy)
ALTER TABLE home_health_service_areas ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access
CREATE POLICY "Allow public read access to service areas"
  ON home_health_service_areas
  FOR SELECT
  TO public
  USING (true);
