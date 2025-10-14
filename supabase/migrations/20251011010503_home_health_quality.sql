-- Add home health quality and patient experience metrics
-- Phase 2: Home Health Quality Metrics from CMS Home Health Compare

-- Create table for detailed home health quality metrics
-- Stores individual quality measures in normalized format
create table if not exists home_health_quality_metrics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Provider identification
  ccn text not null, -- CMS Certification Number

  -- Metric details
  metric_name text not null,
  metric_category text not null, -- 'quality_of_care', 'patient_experience', 'utilization', 'timely_care'
  metric_value numeric(10,2),
  metric_type text not null, -- 'percentage', 'count', 'rate', 'star_rating'

  -- Reporting period
  reporting_period text not null, -- e.g., 'Q1 2024', '2024'
  reporting_start_date date,
  reporting_end_date date,

  -- Metadata
  data_source text not null default 'CMS_HOME_HEALTH_COMPARE',

  -- Constraints
  constraint unique_metric_per_period unique (ccn, metric_name, reporting_period)
);

-- Create table for home health utilization data
create table if not exists home_health_utilization (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Provider identification
  ccn text not null,

  -- Utilization metrics
  total_episodes integer,
  total_patients integer,

  -- Episode details by type (if available)
  early_episodes integer, -- episodes ending in first 30 days
  later_episodes integer, -- episodes after 30 days

  -- Visit utilization
  avg_visits_per_episode numeric(6,2),
  avg_skilled_nursing_visits numeric(6,2),
  avg_pt_visits numeric(6,2),
  avg_ot_visits numeric(6,2),
  avg_st_visits numeric(6,2),
  avg_home_health_aide_visits numeric(6,2),
  avg_medical_social_worker_visits numeric(6,2),

  -- Reporting period
  reporting_period text not null,
  reporting_start_date date,
  reporting_end_date date,

  -- Metadata
  data_source text not null default 'CMS_HOME_HEALTH_UTILIZATION',

  constraint unique_utilization_per_period unique (ccn, reporting_period)
);

-- Extend resources table with home health quality columns
alter table resources
  -- Overall quality stars (from CMS Home Health Compare)
  add column if not exists hh_quality_star numeric(2,1), -- 1-5 stars overall quality rating

  -- Patient experience (CAHPS)
  add column if not exists hh_patient_experience_star numeric(2,1), -- 1-5 stars CAHPS

  -- Quality of patient care measures (percentages)
  add column if not exists hh_timely_care_percent numeric(5,2), -- % getting timely care
  add column if not exists hh_manages_meds_percent numeric(5,2), -- % managing medications properly
  add column if not exists hh_improvement_bathing_percent numeric(5,2), -- % improving in bathing
  add column if not exists hh_improvement_walking_percent numeric(5,2), -- % improving in walking
  add column if not exists hh_improvement_breathing_percent numeric(5,2), -- % improving in breathing
  add column if not exists hh_acute_hospitalization_percent numeric(5,2), -- % with acute hospitalization
  add column if not exists hh_er_use_percent numeric(5,2), -- % using emergency room

  -- CAHPS survey measures (percentages)
  add column if not exists hh_recommend_percent numeric(5,2), -- % who would recommend
  add column if not exists hh_care_rating_9_10_percent numeric(5,2), -- % rating care 9 or 10
  add column if not exists hh_communication_percent numeric(5,2), -- % with good communication
  add column if not exists hh_discussion_meds_percent numeric(5,2), -- % with medication discussion
  add column if not exists hh_team_discussion_percent numeric(5,2), -- % team discussed care

  -- Service area information
  add column if not exists hh_service_zip_codes text[], -- ZIP codes served
  add column if not exists hh_service_counties text[], -- Counties served

  -- CMS provider metadata
  add column if not exists cms_ccn text, -- CMS Certification Number (unique for home health)
  add column if not exists date_certified date; -- When agency was certified

-- Create indexes for efficient queries
create index if not exists idx_hh_quality_metrics_ccn on home_health_quality_metrics (ccn);
create index if not exists idx_hh_quality_metrics_category on home_health_quality_metrics (metric_category);
create index if not exists idx_hh_quality_metrics_period on home_health_quality_metrics (reporting_period);
create index if not exists idx_hh_quality_metrics_name on home_health_quality_metrics (metric_name);

create index if not exists idx_hh_utilization_ccn on home_health_utilization (ccn);
create index if not exists idx_hh_utilization_period on home_health_utilization (reporting_period);

-- Indexes on resources table for home health filtering
create index if not exists idx_resources_hh_quality_star on resources (hh_quality_star) where hh_quality_star is not null;
create index if not exists idx_resources_hh_patient_experience_star on resources (hh_patient_experience_star) where hh_patient_experience_star is not null;
create index if not exists idx_resources_hh_recommend_percent on resources (hh_recommend_percent) where hh_recommend_percent is not null;
create index if not exists idx_resources_cms_ccn on resources (cms_ccn) where cms_ccn is not null;
create index if not exists idx_resources_hh_service_zips on resources using gin (hh_service_zip_codes) where hh_service_zip_codes is not null;

-- Add comments explaining the new columns
comment on column resources.hh_quality_star is 'CMS Home Health Compare overall quality star rating (1-5 stars)';
comment on column resources.hh_patient_experience_star is 'CMS CAHPS patient experience star rating (1-5 stars)';
comment on column resources.hh_timely_care_percent is 'Percentage of patients who got care in a timely manner';
comment on column resources.hh_manages_meds_percent is 'Percentage of patients who properly manage their medications';
comment on column resources.hh_recommend_percent is 'Percentage of patients who would recommend this agency';
comment on column resources.cms_ccn is 'CMS Certification Number (CCN) for home health agencies';
comment on column resources.hh_service_zip_codes is 'Array of ZIP codes where this home health agency provides services';

comment on table home_health_quality_metrics is 'Detailed quality metrics for home health agencies from CMS Home Health Compare';
comment on table home_health_utilization is 'Utilization data for home health agencies including episodes and visit counts';
