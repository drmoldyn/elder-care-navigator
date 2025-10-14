-- Add indexes for faster state-based queries
-- These indexes dramatically improve performance of state landing pages

-- Index for state filtering with GIN operator for array containment
CREATE INDEX IF NOT EXISTS idx_resources_states_gin ON resources USING GIN (states);

-- Index for provider type filtering (commonly used with state queries)
CREATE INDEX IF NOT EXISTS idx_resources_provider_type ON resources (provider_type);

-- Index on sunsetwell_scores for joining
CREATE INDEX IF NOT EXISTS idx_sunsetwell_scores_lookup ON sunsetwell_scores (id, overall_score DESC, overall_percentile);

-- Composite index for city grouping within states
CREATE INDEX IF NOT EXISTS idx_resources_city_state ON resources (city) WHERE city IS NOT NULL;

-- Comment for documentation
COMMENT ON INDEX idx_resources_states_gin IS 'Optimizes state-based facility lookups using GIN index for array containment queries';
COMMENT ON INDEX idx_resources_provider_type IS 'Speeds up filtering by provider type (nursing_home, assisted_living, etc.)';
COMMENT ON INDEX idx_sunsetwell_scores_lookup IS 'Optimizes score-based sorting and filtering';
COMMENT ON INDEX idx_resources_city_state IS 'Improves performance of city grouping queries for state pages';
