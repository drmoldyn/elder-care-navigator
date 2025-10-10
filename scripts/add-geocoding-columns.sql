-- Add geocoding columns to resources table

ALTER TABLE resources
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS geocode_quality VARCHAR(50); -- 'ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_resources_coordinates ON resources(latitude, longitude);

-- Create index for finding non-geocoded facilities
CREATE INDEX IF NOT EXISTS idx_resources_geocoded ON resources(geocoded_at) WHERE geocoded_at IS NULL;

COMMENT ON COLUMN resources.latitude IS 'Facility latitude (Google Geocoding API)';
COMMENT ON COLUMN resources.longitude IS 'Facility longitude (Google Geocoding API)';
COMMENT ON COLUMN resources.geocoded_at IS 'Timestamp when geocoding was performed';
COMMENT ON COLUMN resources.geocode_quality IS 'Geocoding accuracy from Google API';
