-- Add hospice quality metrics to the database
-- This migration adds support for CMS Hospice Quality Reporting Program data
-- and CAHPS (Consumer Assessment of Healthcare Providers and Systems) survey data

-- ============================================================================
-- 1. CREATE NEW TABLES FOR DETAILED QUALITY METRICS
-- ============================================================================

-- Hospice Quality Metrics (HIS/HOPE measures)
-- Stores individual quality measure values by provider and reporting period
create table if not exists hospice_quality_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Provider identification
  ccn text not null, -- CMS Certification Number

  -- Measure details
  metric_name text not null,
  metric_value numeric(10,2),
  metric_type text, -- 'process', 'outcome', 'structural'

  -- Time period
  reporting_period text not null, -- e.g., 'Q1-Q4 2024'
  measure_start_date date,
  measure_end_date date,

  -- Metadata
  numerator integer,
  denominator integer,
  footnote text, -- For suppressed/unavailable data

  -- Ensure unique combinations
  unique(ccn, metric_name, reporting_period)
);

-- CAHPS Hospice Survey Results
-- Stores family/caregiver experience survey scores
create table if not exists hospice_cahps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Provider identification
  ccn text not null,

  -- Survey measure
  survey_measure text not null, -- e.g., 'Communication with family'
  measure_code text, -- e.g., 'HH_COMM_1'

  -- Scores
  score numeric(5,2), -- Percentage or mean score
  top_box_percentage numeric(5,2), -- % who answered 'Always' or 'Definitely Yes'

  -- Time period
  reporting_period text not null, -- e.g., 'Q1 2023 - Q4 2024'

  -- Sample info
  number_of_completed_surveys integer,
  response_rate numeric(5,2),

  -- Footnotes for suppressed data
  footnote text,

  -- Ensure unique combinations
  unique(ccn, survey_measure, reporting_period)
);

-- ============================================================================
-- 2. EXTEND RESOURCES TABLE WITH HOSPICE QUALITY COLUMNS
-- ============================================================================

alter table resources
  -- Overall quality rating (1-5 stars)
  add column if not exists hospice_quality_star numeric(2,1),

  -- CAHPS family experience rating (1-5 stars)
  add column if not exists hospice_cahps_star numeric(2,1),

  -- Key quality measure percentages
  add column if not exists hospice_pain_management_percent numeric(5,2),
  add column if not exists hospice_symptom_management_percent numeric(5,2),
  add column if not exists hospice_emotional_support_percent numeric(5,2),
  add column if not exists hospice_willing_to_recommend_percent numeric(5,2),

  -- Additional CAHPS measures
  add column if not exists hospice_communication_percent numeric(5,2),
  add column if not exists hospice_getting_timely_help_percent numeric(5,2),
  add column if not exists hospice_treating_with_respect_percent numeric(5,2),

  -- Clinical quality measures
  add column if not exists hospice_medication_review_percent numeric(5,2),
  add column if not exists hospice_discussion_of_beliefs_percent numeric(5,2),
  add column if not exists hospice_chemotherapy_in_last_2_weeks numeric(5,2), -- lower is better

  -- Survey response information
  add column if not exists hospice_cahps_survey_count integer,
  add column if not exists hospice_cahps_response_rate numeric(5,2),

  -- Service area and capacity
  add column if not exists hospice_service_area_counties text[], -- Array of counties served
  add column if not exists hospice_accepts_pediatric boolean,

  -- Quality reporting period
  add column if not exists hospice_quality_period text, -- e.g., 'Aug 2025'
  add column if not exists hospice_cahps_period text; -- e.g., 'Q1 2023 - Q4 2024'

-- ============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes on quality metrics table
create index if not exists idx_hospice_quality_ccn on hospice_quality_metrics (ccn);
create index if not exists idx_hospice_quality_metric on hospice_quality_metrics (metric_name);
create index if not exists idx_hospice_quality_period on hospice_quality_metrics (reporting_period);
create index if not exists idx_hospice_quality_value on hospice_quality_metrics (metric_value) where metric_value is not null;

-- Indexes on CAHPS table
create index if not exists idx_hospice_cahps_ccn on hospice_cahps (ccn);
create index if not exists idx_hospice_cahps_measure on hospice_cahps (survey_measure);
create index if not exists idx_hospice_cahps_period on hospice_cahps (reporting_period);
create index if not exists idx_hospice_cahps_score on hospice_cahps (score) where score is not null;

-- Indexes on resources table for hospice filtering
create index if not exists idx_resources_hospice_quality_star
  on resources (hospice_quality_star)
  where hospice_quality_star is not null;

create index if not exists idx_resources_hospice_cahps_star
  on resources (hospice_cahps_star)
  where hospice_cahps_star is not null;

create index if not exists idx_resources_hospice_pain_mgmt
  on resources (hospice_pain_management_percent)
  where hospice_pain_management_percent is not null;

create index if not exists idx_resources_hospice_willing_recommend
  on resources (hospice_willing_to_recommend_percent)
  where hospice_willing_to_recommend_percent is not null;

create index if not exists idx_resources_hospice_service_counties
  on resources using gin (hospice_service_area_counties)
  where hospice_service_area_counties is not null;

-- ============================================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

comment on table hospice_quality_metrics is 'CMS Hospice Quality Reporting Program measures (HIS/HOPE data)';
comment on table hospice_cahps is 'CAHPS Hospice Survey results (family/caregiver experience)';

comment on column resources.hospice_quality_star is 'Overall hospice quality rating (1-5 stars) from CMS Care Compare';
comment on column resources.hospice_cahps_star is 'CAHPS family experience rating (1-5 stars)';
comment on column resources.hospice_pain_management_percent is 'Percentage of patients with pain brought to comfortable level (higher is better)';
comment on column resources.hospice_symptom_management_percent is 'Percentage of patients with symptoms controlled (higher is better)';
comment on column resources.hospice_emotional_support_percent is 'Percentage of patients receiving emotional/spiritual support (higher is better)';
comment on column resources.hospice_willing_to_recommend_percent is 'Percentage of families who would recommend this hospice (higher is better)';
comment on column resources.hospice_chemotherapy_in_last_2_weeks is 'Percentage receiving chemo in last 2 weeks of life (lower is better - potential quality issue)';
comment on column resources.hospice_service_area_counties is 'Array of county names where hospice provides service';
comment on column resources.hospice_accepts_pediatric is 'Whether hospice accepts pediatric patients';

-- ============================================================================
-- 5. CREATE VIEW FOR EASY QUERYING OF TOP-RATED HOSPICES
-- ============================================================================

create or replace view hospice_quality_summary as
select
  r.id,
  r.title,
  r.facility_id as ccn,
  r.states[1] as state,
  r.address_city as city,
  r.address_county as county,
  r.contact_phone as phone,
  r.url,

  -- Quality ratings
  r.hospice_quality_star,
  r.hospice_cahps_star,

  -- Key performance metrics
  r.hospice_pain_management_percent,
  r.hospice_symptom_management_percent,
  r.hospice_willing_to_recommend_percent,
  r.hospice_emotional_support_percent,

  -- Survey data
  r.hospice_cahps_survey_count,
  r.hospice_cahps_response_rate,

  -- Service area
  r.hospice_service_area_counties,
  r.hospice_accepts_pediatric,

  -- Reporting periods
  r.hospice_quality_period,
  r.hospice_cahps_period,

  -- Overall metadata
  r.updated_at as last_data_update
from
  resources r
where
  r.category @> array['hospice']::text[]
  and r.hospice_quality_star is not null
order by
  r.hospice_quality_star desc nulls last,
  r.hospice_cahps_star desc nulls last,
  r.hospice_willing_to_recommend_percent desc nulls last;

comment on view hospice_quality_summary is 'Summary view of hospice providers with quality metrics for easy querying';
