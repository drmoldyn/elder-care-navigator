-- Nursing Home Quality & Inspection Data
-- Phase 1: CMS Quality Metrics, Deficiencies, and Penalties
-- This migration creates tables for detailed nursing home quality data from CMS

-- Quality Measures Table
-- Stores clinical quality metrics from CMS (rehospitalization rates, pressure ulcers, etc.)
create table if not exists nursing_home_quality_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Facility Identification
  provider_id text not null, -- Federal Provider Number (CCN)
  provider_name text not null,

  -- Measurement Period
  measure_code text not null, -- e.g., "401" for rehospitalization
  measure_name text not null,
  measure_period_start date,
  measure_period_end date,

  -- Quality Scores
  score numeric(6,2), -- The actual measure value (e.g., 15.5%)
  denominator integer, -- Number of eligible residents
  numerator integer, -- Number with the outcome

  -- Performance
  performance_category text, -- 'Much Below Average', 'Below Average', 'Average', 'Above Average', 'Much Above Average'
  footnote text, -- CMS footnotes explaining data quality issues

  -- Metadata
  data_as_of date not null,

  -- Composite unique constraint to prevent duplicates
  unique(provider_id, measure_code, measure_period_start, measure_period_end)
);

create index if not exists idx_quality_metrics_provider on nursing_home_quality_metrics (provider_id);
create index if not exists idx_quality_metrics_measure on nursing_home_quality_metrics (measure_code);
create index if not exists idx_quality_metrics_performance on nursing_home_quality_metrics (performance_category);
create index if not exists idx_quality_metrics_period on nursing_home_quality_metrics (measure_period_end desc);

comment on table nursing_home_quality_metrics is 'CMS quality measures for nursing homes (MDS-based and claims-based)';
comment on column nursing_home_quality_metrics.measure_code is 'CMS measure identifier (e.g., 401=Rehospitalization, 451=UTI)';
comment on column nursing_home_quality_metrics.score is 'Actual measure value as percentage or rate';


-- Health Deficiencies Table
-- Stores inspection deficiencies cited during state surveys
create table if not exists nursing_home_deficiencies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Facility Identification
  provider_id text not null, -- Federal Provider Number (CCN)
  provider_name text not null,

  -- Deficiency Details
  deficiency_tag text not null, -- F-tag (e.g., "F323" for quality of care)
  deficiency_description text,

  -- Severity
  scope text, -- 'Isolated', 'Pattern', 'Widespread'
  severity text, -- 'Minimal harm', 'Actual harm', 'Immediate jeopardy', etc.
  scope_severity_code text, -- Combined code like 'D' (isolated, no actual harm)

  -- Survey Information
  survey_date date not null,
  survey_type text, -- 'Health', 'Fire Safety', 'Life Safety'
  inspection_id text,

  -- Correction Status
  correction_date date,
  is_corrected boolean default false,

  -- Display on Care Compare
  displayed_on_care_compare boolean default true,

  -- Metadata
  data_as_of date not null,

  -- Index for quick lookups
  unique(provider_id, deficiency_tag, survey_date, inspection_id)
);

create index if not exists idx_deficiencies_provider on nursing_home_deficiencies (provider_id);
create index if not exists idx_deficiencies_tag on nursing_home_deficiencies (deficiency_tag);
create index if not exists idx_deficiencies_severity on nursing_home_deficiencies (scope_severity_code);
create index if not exists idx_deficiencies_survey_date on nursing_home_deficiencies (survey_date desc);
create index if not exists idx_deficiencies_corrected on nursing_home_deficiencies (is_corrected);

comment on table nursing_home_deficiencies is 'CMS health deficiencies cited during nursing home inspections';
comment on column nursing_home_deficiencies.deficiency_tag is 'Federal deficiency tag (F-tag) identifying the regulation violated';
comment on column nursing_home_deficiencies.scope_severity_code is 'Combined scope/severity code determining enforcement action';


-- Penalties and Enforcement Actions Table
-- Stores civil money penalties, denial of payment, and other enforcement remedies
create table if not exists nursing_home_penalties (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Facility Identification
  provider_id text not null, -- Federal Provider Number (CCN)
  provider_name text not null,
  provider_address text,
  provider_city text,
  provider_state text,
  provider_zip text,

  -- Penalty Details
  penalty_type text not null, -- 'Civil Money Penalty', 'Denial of Payment for New Admissions', etc.
  penalty_date date not null, -- Date penalty was imposed

  -- Fine Amount (for CMPs)
  fine_amount numeric(10,2), -- Dollar amount of civil money penalty

  -- Payment Denial Period (for DPNA)
  payment_denial_start_date date,
  payment_denial_end_date date,

  -- Processing
  processing_date date,

  -- Metadata
  data_as_of date not null,

  -- Prevent duplicate penalties
  unique(provider_id, penalty_type, penalty_date)
);

create index if not exists idx_penalties_provider on nursing_home_penalties (provider_id);
create index if not exists idx_penalties_type on nursing_home_penalties (penalty_type);
create index if not exists idx_penalties_date on nursing_home_penalties (penalty_date desc);
create index if not exists idx_penalties_fine_amount on nursing_home_penalties (fine_amount) where fine_amount is not null;

comment on table nursing_home_penalties is 'CMS enforcement actions against nursing homes including CMPs and DPNA';
comment on column nursing_home_penalties.fine_amount is 'Civil money penalty amount in dollars';
comment on column nursing_home_penalties.payment_denial_start_date is 'Start date for denial of payment for new admissions (DPNA)';


-- Extend resources table with quality summary fields
-- These provide quick access to key quality indicators without joining
alter table resources
  -- Overall Quality Rating (already exists from previous migrations, but adding comment)
  add column if not exists last_survey_date date,
  add column if not exists deficiency_count integer default 0,
  add column if not exists total_penalties_amount numeric(10,2) default 0,

  -- Survey Cycle Performance
  add column if not exists health_survey_rating numeric(2,1), -- 1-5 stars
  add column if not exists qm_survey_rating numeric(2,1), -- 1-5 stars (quality measures)
  add column if not exists staffing_survey_rating numeric(2,1), -- 1-5 stars

  -- Key Quality Flags (derived from deficiencies/penalties)
  add column if not exists has_immediate_jeopardy boolean default false,
  add column if not exists has_substandard_care boolean default false,
  add column if not exists has_complaint_investigation boolean default false,
  add column if not exists has_civil_money_penalty boolean default false,
  add column if not exists has_payment_denial boolean default false;

create index if not exists idx_resources_last_survey on resources (last_survey_date) where last_survey_date is not null;
create index if not exists idx_resources_deficiency_count on resources (deficiency_count) where deficiency_count > 0;
create index if not exists idx_resources_penalties on resources (total_penalties_amount) where total_penalties_amount > 0;
create index if not exists idx_resources_health_survey on resources (health_survey_rating) where health_survey_rating is not null;
create index if not exists idx_resources_qm_survey on resources (qm_survey_rating) where qm_survey_rating is not null;
create index if not exists idx_resources_immediate_jeopardy on resources (has_immediate_jeopardy) where has_immediate_jeopardy = true;

comment on column resources.last_survey_date is 'Date of most recent standard health inspection';
comment on column resources.deficiency_count is 'Total number of health deficiencies cited in current survey cycle';
comment on column resources.total_penalties_amount is 'Total dollar amount of civil money penalties in last 3 years';
comment on column resources.has_immediate_jeopardy is 'Facility has immediate jeopardy deficiency (most serious)';
comment on column resources.has_substandard_care is 'Facility provided substandard quality of care';


-- Function to update resource quality summary from detail tables
-- This can be called after importing quality data to sync the summary fields
create or replace function update_nursing_home_quality_summary()
returns void as $$
begin
  -- Update deficiency counts and dates
  update resources r
  set
    deficiency_count = coalesce(d.count, 0),
    last_survey_date = d.latest_survey,
    has_immediate_jeopardy = coalesce(d.has_ij, false),
    has_substandard_care = coalesce(d.has_substandard, false)
  from (
    select
      provider_id,
      count(*) as count,
      max(survey_date) as latest_survey,
      bool_or(severity ilike '%immediate jeopardy%') as has_ij,
      bool_or(severity ilike '%substandard%') as has_substandard
    from nursing_home_deficiencies
    where is_corrected = false
    group by provider_id
  ) d
  where r.facility_id = d.provider_id;

  -- Update penalty information
  update resources r
  set
    total_penalties_amount = coalesce(p.total_fines, 0),
    has_civil_money_penalty = coalesce(p.has_cmp, false),
    has_payment_denial = coalesce(p.has_dpna, false)
  from (
    select
      provider_id,
      sum(fine_amount) as total_fines,
      bool_or(penalty_type ilike '%civil money%') as has_cmp,
      bool_or(penalty_type ilike '%denial%payment%') as has_dpna
    from nursing_home_penalties
    where penalty_date >= current_date - interval '3 years'
    group by provider_id
  ) p
  where r.facility_id = p.provider_id;

  raise notice 'Updated quality summary for nursing homes';
end;
$$ language plpgsql;

comment on function update_nursing_home_quality_summary is 'Updates resources table quality summary from detail tables';
