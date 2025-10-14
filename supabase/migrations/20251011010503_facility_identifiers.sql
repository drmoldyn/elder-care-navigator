-- Facility Identifiers Crosswalk
-- Enables linking facilities across different data sources using multiple identifiers
-- Part of Phase 4 of the Data Acquisition Plan

-- Create the facility_identifiers table
CREATE TABLE IF NOT EXISTS facility_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the resource record
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Identifier information
  identifier_type text NOT NULL CHECK (identifier_type IN (
    'CCN',              -- CMS Certification Number (nursing homes, home health, hospice)
    'NPI',              -- National Provider Identifier
    'STATE_LICENSE',    -- State-issued license number (ALFs, state-specific)
    'MEDICARE_ID',      -- Medicare provider ID (if different from CCN)
    'MEDICAID_ID'       -- Medicaid provider ID
  )),
  identifier_value text NOT NULL,

  -- Geographic context (important for state licenses)
  state text,         -- 2-letter state code, nullable for national IDs like NPI

  -- Data provenance
  source text NOT NULL CHECK (source IN (
    'CMS',              -- Centers for Medicare & Medicaid Services
    'STATE_LICENSING',  -- State health department or licensing board
    'MANUAL',           -- Manually added/verified
    'IMPORT',           -- Imported from CSV/data file
    'API'               -- Added via API
  )),

  -- Confidence scoring for fuzzy matches
  confidence_score numeric(3, 2) NOT NULL DEFAULT 1.0 CHECK (
    confidence_score >= 0 AND confidence_score <= 1.0
  ),

  -- Verification tracking
  verified_at timestamptz,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
-- Unique constraint: one identifier of each type per resource/state combination
-- This allows a facility to have the same license number in different states
CREATE UNIQUE INDEX idx_facility_identifiers_unique
  ON facility_identifiers (identifier_type, identifier_value, COALESCE(state, ''));

-- Index for looking up resources by identifier
CREATE INDEX idx_facility_identifiers_lookup
  ON facility_identifiers (identifier_type, identifier_value);

-- Index for finding all identifiers for a resource
CREATE INDEX idx_facility_identifiers_resource
  ON facility_identifiers (resource_id);

-- Index for filtering by identifier type
CREATE INDEX idx_facility_identifiers_type
  ON facility_identifiers (identifier_type);

-- Index for finding unverified identifiers
CREATE INDEX idx_facility_identifiers_verification
  ON facility_identifiers (verified_at)
  WHERE verified_at IS NULL;

-- Index for low-confidence matches that may need review
CREATE INDEX idx_facility_identifiers_confidence
  ON facility_identifiers (confidence_score)
  WHERE confidence_score < 1.0;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_facility_identifiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_facility_identifiers_updated_at
  BEFORE UPDATE ON facility_identifiers
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_identifiers_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE facility_identifiers ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (for matching and lookups)
-- This allows anyone to search for facilities by their identifiers
CREATE POLICY facility_identifiers_read_public
  ON facility_identifiers
  FOR SELECT
  USING (true);

-- Policy: Service role write access (for ETL scripts and admin operations)
-- Only the service role can insert, update, or delete identifiers
CREATE POLICY facility_identifiers_write_service
  ON facility_identifiers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Helper view: Deduplicated identifiers with resource details
-- Useful for quickly finding potential duplicates
CREATE OR REPLACE VIEW view_facility_identifier_summary AS
SELECT
  fi.identifier_type,
  fi.identifier_value,
  fi.state,
  COUNT(DISTINCT fi.resource_id) as resource_count,
  array_agg(DISTINCT fi.resource_id ORDER BY fi.resource_id) as resource_ids,
  array_agg(DISTINCT r.title ORDER BY r.title) as facility_names,
  MIN(fi.confidence_score) as min_confidence,
  MAX(fi.confidence_score) as max_confidence,
  array_agg(DISTINCT fi.source ORDER BY fi.source) as sources
FROM facility_identifiers fi
JOIN resources r ON r.id = fi.resource_id
GROUP BY fi.identifier_type, fi.identifier_value, fi.state;

-- Comment documentation
COMMENT ON TABLE facility_identifiers IS 'Crosswalk table linking facilities to their various identifiers (CCN, NPI, state licenses, etc.) across different data sources';
COMMENT ON COLUMN facility_identifiers.identifier_type IS 'Type of identifier: CCN, NPI, STATE_LICENSE, MEDICARE_ID, or MEDICAID_ID';
COMMENT ON COLUMN facility_identifiers.identifier_value IS 'The actual identifier value (e.g., "123456" for a CCN)';
COMMENT ON COLUMN facility_identifiers.state IS 'Two-letter state code for state-specific identifiers, NULL for national identifiers';
COMMENT ON COLUMN facility_identifiers.source IS 'Data source: CMS, STATE_LICENSING, MANUAL, IMPORT, or API';
COMMENT ON COLUMN facility_identifiers.confidence_score IS 'Matching confidence from 0.0 to 1.0, where 1.0 is exact match and lower values indicate fuzzy/probabilistic matches';
COMMENT ON COLUMN facility_identifiers.verified_at IS 'Timestamp when identifier was manually verified as correct';

-- Grant appropriate permissions
-- Note: These grants assume standard Supabase roles
-- Adjust if your setup uses different role names
GRANT SELECT ON facility_identifiers TO anon, authenticated;
GRANT ALL ON facility_identifiers TO service_role;
GRANT SELECT ON view_facility_identifier_summary TO anon, authenticated;
