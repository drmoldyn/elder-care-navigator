-- SunsetWell Scoring System
-- Adds peer group normalization and percentile scoring for facilities

-- Peer groups for benchmarking facilities against similar organizations
CREATE TABLE IF NOT EXISTS peer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    facility_type TEXT NOT NULL, -- nursing_home, home_health, hospice, assisted_living
    criteria JSONB NOT NULL, -- JSON defining criteria (e.g., {"bed_count_min": 50, "bed_count_max": 150, "state": "VA"})
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_peer_groups_facility_type ON peer_groups(facility_type);
CREATE INDEX idx_peer_groups_criteria ON peer_groups USING GIN(criteria);

-- Regional/peer group benchmarks for each metric
CREATE TABLE IF NOT EXISTS benchmark_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    peer_group_id UUID REFERENCES peer_groups(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL, -- e.g., 'overall_rating', 'rn_staffing_rating', 'deficiency_count'

    -- Statistical measures
    mean NUMERIC,
    median NUMERIC,
    std_dev NUMERIC,
    min_value NUMERIC,
    max_value NUMERIC,

    -- Percentiles for ranking
    p10 NUMERIC,
    p25 NUMERIC,
    p50 NUMERIC,
    p75 NUMERIC,
    p90 NUMERIC,

    -- Sample size
    sample_count INTEGER,

    -- Metadata
    calculation_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(peer_group_id, metric_name, calculation_date)
);

CREATE INDEX idx_benchmark_metrics_peer_group ON benchmark_metrics(peer_group_id);
CREATE INDEX idx_benchmark_metrics_name ON benchmark_metrics(metric_name);

-- SunsetWell Scores for each facility
CREATE TABLE IF NOT EXISTS sunsetwell_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id TEXT NOT NULL REFERENCES resources(facility_id) ON DELETE CASCADE,
    peer_group_id UUID REFERENCES peer_groups(id) ON DELETE SET NULL,

    -- Overall SunsetWell Score (0-100)
    overall_score NUMERIC(5,2),

    -- Component scores (0-100 each)
    quality_score NUMERIC(5,2),
    staffing_score NUMERIC(5,2),
    safety_score NUMERIC(5,2),
    care_score NUMERIC(5,2),

    -- Percentile rankings within peer group
    overall_percentile NUMERIC(5,2),
    quality_percentile NUMERIC(5,2),
    staffing_percentile NUMERIC(5,2),
    safety_percentile NUMERIC(5,2),
    care_percentile NUMERIC(5,2),

    -- Individual metric percentiles (stored as JSONB for flexibility)
    metric_percentiles JSONB, -- e.g., {"overall_rating": 85.5, "rn_staffing_rating": 72.3}

    -- Metadata
    calculation_date DATE DEFAULT CURRENT_DATE,
    version TEXT DEFAULT '1.0', -- For tracking scoring algorithm versions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(facility_id, calculation_date)
);

CREATE INDEX idx_sunsetwell_scores_facility ON sunsetwell_scores(facility_id);
CREATE INDEX idx_sunsetwell_scores_peer_group ON sunsetwell_scores(peer_group_id);
CREATE INDEX idx_sunsetwell_scores_overall ON sunsetwell_scores(overall_score DESC);
CREATE INDEX idx_sunsetwell_scores_date ON sunsetwell_scores(calculation_date);
CREATE INDEX idx_sunsetwell_scores_percentiles ON sunsetwell_scores USING GIN(metric_percentiles);

-- Score calculation audit log
CREATE TABLE IF NOT EXISTS score_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calculation_date DATE NOT NULL,
    peer_group_id UUID REFERENCES peer_groups(id) ON DELETE SET NULL,
    facilities_scored INTEGER,
    metrics_used TEXT[],
    algorithm_version TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_score_calculations_date ON score_calculations(calculation_date DESC);

-- Function to get facility's peer group based on criteria
CREATE OR REPLACE FUNCTION get_facility_peer_group(p_facility_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_peer_group_id UUID;
    v_facility RECORD;
BEGIN
    -- Get facility details
    SELECT
        provider_type,
        total_beds,
        state,
        county
    INTO v_facility
    FROM resources
    WHERE facility_id = p_facility_id;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Find matching peer group (this is a simple example, can be enhanced)
    SELECT id INTO v_peer_group_id
    FROM peer_groups
    WHERE facility_type = v_facility.provider_type
        AND (
            criteria->>'state' IS NULL
            OR criteria->>'state' = v_facility.state
        )
        AND (
            criteria->>'bed_count_min' IS NULL
            OR (criteria->>'bed_count_min')::INTEGER <= v_facility.total_beds
        )
        AND (
            criteria->>'bed_count_max' IS NULL
            OR (criteria->>'bed_count_max')::INTEGER >= v_facility.total_beds
        )
    ORDER BY
        -- Prioritize more specific peer groups
        CASE WHEN criteria->>'state' IS NOT NULL THEN 1 ELSE 2 END,
        CASE WHEN criteria->>'bed_count_min' IS NOT NULL THEN 1 ELSE 2 END
    LIMIT 1;

    RETURN v_peer_group_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate percentile for a given value within a peer group
CREATE OR REPLACE FUNCTION calculate_percentile(
    p_value NUMERIC,
    p_peer_group_id UUID,
    p_metric_name TEXT,
    p_higher_is_better BOOLEAN DEFAULT TRUE
)
RETURNS NUMERIC AS $$
DECLARE
    v_percentile NUMERIC;
    v_benchmark RECORD;
BEGIN
    -- Get benchmark statistics
    SELECT * INTO v_benchmark
    FROM benchmark_metrics
    WHERE peer_group_id = p_peer_group_id
        AND metric_name = p_metric_name
    ORDER BY calculation_date DESC
    LIMIT 1;

    IF NOT FOUND OR v_benchmark.std_dev = 0 THEN
        RETURN NULL;
    END IF;

    -- Calculate z-score and convert to percentile
    -- This is a simplified calculation; Codex can implement more sophisticated methods
    v_percentile := (
        SELECT CASE
            WHEN p_value <= v_benchmark.p10 THEN 10
            WHEN p_value <= v_benchmark.p25 THEN 25
            WHEN p_value <= v_benchmark.p50 THEN 50
            WHEN p_value <= v_benchmark.p75 THEN 75
            WHEN p_value <= v_benchmark.p90 THEN 90
            ELSE 95
        END
    );

    -- Invert percentile if lower is better
    IF NOT p_higher_is_better THEN
        v_percentile := 100 - v_percentile;
    END IF;

    RETURN v_percentile;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE peer_groups IS 'Defines peer groups for benchmarking facilities against similar organizations';
COMMENT ON TABLE benchmark_metrics IS 'Regional/peer group statistical benchmarks for each metric';
COMMENT ON TABLE sunsetwell_scores IS 'Calculated SunsetWell Scores with percentile rankings for each facility';
COMMENT ON TABLE score_calculations IS 'Audit log of score calculation runs';

COMMENT ON COLUMN sunsetwell_scores.overall_score IS 'Composite SunsetWell Score (0-100) combining all factors';
COMMENT ON COLUMN sunsetwell_scores.quality_score IS 'Quality component score based on ratings, outcomes, and metrics';
COMMENT ON COLUMN sunsetwell_scores.staffing_score IS 'Staffing component score based on RN/total staffing levels';
COMMENT ON COLUMN sunsetwell_scores.safety_score IS 'Safety component score based on deficiencies and penalties';
COMMENT ON COLUMN sunsetwell_scores.care_score IS 'Care quality score based on patient outcomes and satisfaction';
COMMENT ON COLUMN sunsetwell_scores.metric_percentiles IS 'JSONB object storing percentile rank for each individual metric';
