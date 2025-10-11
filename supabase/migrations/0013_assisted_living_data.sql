-- Migration: Assisted Living Facility Data
-- Phase 5: State ALF Data Integration
-- Adds fields for state licensing, inspections, and ALF-specific attributes

-- ============================================================================
-- PART 1: Extend resources table with ALF-specific fields
-- ============================================================================

-- State licensing and status
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS state_license_number text,
  ADD COLUMN IF NOT EXISTS license_status text, -- 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'REVOKED'
  ADD COLUMN IF NOT EXISTS license_issue_date date,
  ADD COLUMN IF NOT EXISTS license_expiration_date date;

-- Facility capacity and certifications
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS licensed_capacity integer,
  ADD COLUMN IF NOT EXISTS memory_care_certified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS secure_unit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dementia_care_unit boolean DEFAULT false;

-- Pricing information (monthly costs)
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS monthly_cost_low numeric(10, 2),
  ADD COLUMN IF NOT EXISTS monthly_cost_high numeric(10, 2),
  ADD COLUMN IF NOT EXISTS monthly_cost_median numeric(10, 2),
  ADD COLUMN IF NOT EXISTS cost_last_updated date;

-- Inspection and quality metrics
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS last_inspection_date date,
  ADD COLUMN IF NOT EXISTS inspection_score numeric(5, 2),
  ADD COLUMN IF NOT EXISTS total_violations_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS critical_violations_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS complaint_count integer DEFAULT 0;

-- Additional ALF characteristics
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS waiver_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_rooms_available boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_rooms_available boolean DEFAULT false;

-- ============================================================================
-- PART 2: Create assisted_living_inspections table
-- ============================================================================

CREATE TABLE IF NOT EXISTS assisted_living_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Link to facility
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Inspection details
  inspection_date date NOT NULL,
  inspection_type text NOT NULL, -- 'ROUTINE', 'COMPLAINT', 'FOLLOW_UP', 'RENEWAL', 'INITIAL'
  inspection_status text, -- 'COMPLETED', 'IN_PROGRESS', 'PENDING'

  -- Violations and findings
  violations_count integer DEFAULT 0,
  critical_violations_count integer DEFAULT 0,
  non_critical_violations_count integer DEFAULT 0,
  violations_summary text,

  -- Scores and ratings (state-specific)
  overall_score numeric(5, 2),
  compliance_score numeric(5, 2),

  -- Enforcement actions
  enforcement_action text, -- 'NONE', 'WARNING', 'CITATION', 'FINE', 'PROVISIONAL_LICENSE', 'SUSPENSION'
  fine_amount numeric(10, 2),

  -- Inspector information
  inspector_name text,
  inspector_id text,

  -- Source tracking
  source_state text NOT NULL, -- 'CA', 'FL', 'TX', 'NY'
  source_url text,
  source_report_id text,

  -- Raw data storage (preserve original for audit trail)
  raw_data jsonb,

  -- Metadata
  data_last_updated timestamptz
);

-- Indexes for inspections
CREATE INDEX IF NOT EXISTS idx_alf_inspections_resource ON assisted_living_inspections(resource_id);
CREATE INDEX IF NOT EXISTS idx_alf_inspections_date ON assisted_living_inspections(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_alf_inspections_type ON assisted_living_inspections(inspection_type);
CREATE INDEX IF NOT EXISTS idx_alf_inspections_state ON assisted_living_inspections(source_state);
CREATE INDEX IF NOT EXISTS idx_alf_inspections_violations ON assisted_living_inspections(violations_count) WHERE violations_count > 0;

-- ============================================================================
-- PART 3: Create assisted_living_violations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS assisted_living_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Link to inspection
  inspection_id uuid NOT NULL REFERENCES assisted_living_inspections(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Violation details
  violation_date date NOT NULL,
  violation_code text,
  violation_category text, -- 'CARE', 'SAFETY', 'STAFFING', 'MEDICATION', 'ENVIRONMENT', 'ADMINISTRATIVE'
  violation_severity text, -- 'CRITICAL', 'MAJOR', 'MINOR'
  violation_description text NOT NULL,

  -- Correction tracking
  correction_required boolean DEFAULT true,
  correction_deadline date,
  correction_verified boolean DEFAULT false,
  correction_verified_date date,

  -- Source tracking
  source_state text NOT NULL,
  raw_data jsonb
);

-- Indexes for violations
CREATE INDEX IF NOT EXISTS idx_alf_violations_inspection ON assisted_living_violations(inspection_id);
CREATE INDEX IF NOT EXISTS idx_alf_violations_resource ON assisted_living_violations(resource_id);
CREATE INDEX IF NOT EXISTS idx_alf_violations_severity ON assisted_living_violations(violation_severity);
CREATE INDEX IF NOT EXISTS idx_alf_violations_category ON assisted_living_violations(violation_category);
CREATE INDEX IF NOT EXISTS idx_alf_violations_date ON assisted_living_violations(violation_date DESC);

-- ============================================================================
-- PART 4: Create facility_identifiers table (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS facility_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Link to resource
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,

  -- Identifier details
  identifier_type text NOT NULL, -- 'CCN', 'NPI', 'STATE_LICENSE', 'FACILITY_ID', 'PROPRIETARY_ID'
  identifier_value text NOT NULL,
  identifier_state text, -- State code if state-specific (e.g., 'CA', 'FL', 'TX', 'NY')

  -- Metadata
  source text NOT NULL, -- 'CMS', 'STATE_CA', 'STATE_FL', 'STATE_TX', 'STATE_NY', 'MANUAL'
  confidence_score numeric(3, 2) DEFAULT 1.00, -- 0.00 to 1.00
  is_primary boolean DEFAULT false,
  verified boolean DEFAULT false,
  verified_date date,

  -- Prevent duplicate identifiers
  UNIQUE(identifier_type, identifier_value, identifier_state)
);

-- Indexes for facility_identifiers
CREATE INDEX IF NOT EXISTS idx_facility_identifiers_resource ON facility_identifiers(resource_id);
CREATE INDEX IF NOT EXISTS idx_facility_identifiers_type ON facility_identifiers(identifier_type);
CREATE INDEX IF NOT EXISTS idx_facility_identifiers_value ON facility_identifiers(identifier_value);
CREATE INDEX IF NOT EXISTS idx_facility_identifiers_state ON facility_identifiers(identifier_state);

-- ============================================================================
-- PART 5: Indexes on resources table for ALF queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_resources_state_license ON resources(state_license_number) WHERE state_license_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_license_status ON resources(license_status) WHERE license_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_memory_care ON resources(memory_care_certified) WHERE memory_care_certified = true;
CREATE INDEX IF NOT EXISTS idx_resources_licensed_capacity ON resources(licensed_capacity) WHERE licensed_capacity IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_last_inspection ON resources(last_inspection_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_resources_medicaid_accepted ON resources(medicaid_accepted) WHERE medicaid_accepted = true;

-- Composite index for common ALF searches
CREATE INDEX IF NOT EXISTS idx_resources_alf_search ON resources(provider_type, state, license_status, memory_care_certified)
  WHERE provider_type = 'assisted_living';

-- ============================================================================
-- PART 6: Helper functions
-- ============================================================================

-- Function to get the most recent inspection for a facility
CREATE OR REPLACE FUNCTION get_latest_inspection(facility_resource_id uuid)
RETURNS TABLE (
  inspection_id uuid,
  inspection_date date,
  inspection_type text,
  violations_count integer,
  overall_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    assisted_living_inspections.inspection_date,
    assisted_living_inspections.inspection_type,
    assisted_living_inspections.violations_count,
    assisted_living_inspections.overall_score
  FROM assisted_living_inspections
  WHERE resource_id = facility_resource_id
  ORDER BY assisted_living_inspections.inspection_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate violation summary for a facility
CREATE OR REPLACE FUNCTION calculate_violation_summary(facility_resource_id uuid, months_back integer DEFAULT 12)
RETURNS TABLE (
  total_inspections integer,
  total_violations integer,
  critical_violations integer,
  latest_inspection_date date,
  violation_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ali.id)::integer as total_inspections,
    SUM(ali.violations_count)::integer as total_violations,
    SUM(ali.critical_violations_count)::integer as critical_violations,
    MAX(ali.inspection_date) as latest_inspection_date,
    CASE
      WHEN COUNT(DISTINCT ali.id) > 0
      THEN ROUND((SUM(ali.violations_count)::numeric / COUNT(DISTINCT ali.id)::numeric), 2)
      ELSE 0
    END as violation_rate
  FROM assisted_living_inspections ali
  WHERE ali.resource_id = facility_resource_id
    AND ali.inspection_date >= CURRENT_DATE - (months_back || ' months')::interval
  GROUP BY ali.resource_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: Update trigger for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_assisted_living_inspections_updated_at ON assisted_living_inspections;
CREATE TRIGGER update_assisted_living_inspections_updated_at
  BEFORE UPDATE ON assisted_living_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facility_identifiers_updated_at ON facility_identifiers;
CREATE TRIGGER update_facility_identifiers_updated_at
  BEFORE UPDATE ON facility_identifiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 8: Comments for documentation
-- ============================================================================

COMMENT ON TABLE assisted_living_inspections IS 'State inspection records for assisted living facilities from CA, FL, TX, NY licensing databases';
COMMENT ON TABLE assisted_living_violations IS 'Individual violations found during ALF inspections';
COMMENT ON TABLE facility_identifiers IS 'Crosswalk table mapping various facility identifiers (CCN, NPI, state licenses) to resources';

COMMENT ON COLUMN resources.state_license_number IS 'State-issued license number for the facility';
COMMENT ON COLUMN resources.license_status IS 'Current status of state license: ACTIVE, INACTIVE, SUSPENDED, PENDING, REVOKED';
COMMENT ON COLUMN resources.licensed_capacity IS 'Maximum number of residents licensed to care for';
COMMENT ON COLUMN resources.memory_care_certified IS 'Facility is certified/licensed to provide memory care services';
COMMENT ON COLUMN resources.secure_unit IS 'Has secure unit for residents with dementia/wandering risk';
COMMENT ON COLUMN resources.monthly_cost_low IS 'Lowest monthly cost (base rate)';
COMMENT ON COLUMN resources.monthly_cost_high IS 'Highest monthly cost (typically with memory care or additional services)';
COMMENT ON COLUMN resources.last_inspection_date IS 'Date of most recent state inspection';
COMMENT ON COLUMN resources.inspection_score IS 'Score from most recent inspection (state-specific scale)';
COMMENT ON COLUMN resources.total_violations_count IS 'Total violations found in most recent inspection';
COMMENT ON COLUMN resources.critical_violations_count IS 'Critical/severe violations in most recent inspection';

-- ============================================================================
-- End of migration
-- ============================================================================
