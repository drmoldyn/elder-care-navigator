-- Simple migration to add insurance coverage and address fields
-- No PostGIS required - we'll use address/ZIP for now

-- Add address fields to resources table
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS street_address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS zip_code text,
  ADD COLUMN IF NOT EXISTS county text;

-- Add insurance coverage fields
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS medicare_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS medicaid_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_insurance_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS veterans_affairs_accepted boolean DEFAULT false;

-- Add provider identification fields
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS facility_id text, -- CMS CCN, state license number
  ADD COLUMN IF NOT EXISTS npi text, -- National Provider Identifier
  ADD COLUMN IF NOT EXISTS provider_type text; -- nursing_home, assisted_living, home_health, hospice, adult_day_care

-- Add facility characteristics
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS total_beds integer,
  ADD COLUMN IF NOT EXISTS ownership_type text, -- for_profit, non_profit, government
  ADD COLUMN IF NOT EXISTS quality_rating decimal(3, 2), -- CMS 5-star rating
  ADD COLUMN IF NOT EXISTS services_offered text[], -- array of services
  ADD COLUMN IF NOT EXISTS specialties text[]; -- array of specialties

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resources_zip ON resources (zip_code);
CREATE INDEX IF NOT EXISTS idx_resources_city_state ON resources (city, state);
CREATE INDEX IF NOT EXISTS idx_resources_insurance ON resources (medicare_accepted, medicaid_accepted, private_insurance_accepted, veterans_affairs_accepted);
CREATE INDEX IF NOT EXISTS idx_resources_provider_type ON resources (provider_type);
CREATE INDEX IF NOT EXISTS idx_resources_facility_id ON resources (facility_id);

-- Create a simple function to search by ZIP code proximity (using ZIP code prefix)
CREATE OR REPLACE FUNCTION find_resources_by_zip_area(
  target_zip text,
  radius_zips integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  provider_type text,
  city text,
  state text,
  zip_code text
) AS $$
BEGIN
  -- Simple proximity: same ZIP prefix (first 3 digits)
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.provider_type,
    r.city,
    r.state,
    r.zip_code
  FROM resources r
  WHERE r.zip_code IS NOT NULL
    AND r.zip_code LIKE (SUBSTRING(target_zip FROM 1 FOR 3) || '%')
  ORDER BY r.zip_code;
END;
$$ LANGUAGE plpgsql;
