-- Copy of migration 0008_add_staffing_metrics.sql
-- Run this in Supabase SQL Editor

-- Add staffing and quality metrics to resources table
-- These columns are only applicable to nursing homes, will be NULL for other facility types

alter table resources
  -- Staffing ratings (1-5 stars)
  add column if not exists staffing_rating numeric(2,1),

  -- Total staffing hours per resident per day
  add column if not exists total_nurse_hours_per_resident_per_day numeric(4,2),
  add column if not exists rn_hours_per_resident_per_day numeric(4,2),
  add column if not exists lpn_hours_per_resident_per_day numeric(4,2),
  add column if not exists cna_hours_per_resident_per_day numeric(4,2),

  -- Weekend staffing
  add column if not exists weekend_nurse_hours_per_resident_per_day numeric(4,2),
  add column if not exists weekend_rn_hours_per_resident_per_day numeric(4,2),

  -- Staff turnover percentages
  add column if not exists total_nurse_staff_turnover numeric(5,2),
  add column if not exists rn_turnover numeric(5,2),

  -- Case-mix adjusted staffing (accounts for resident acuity)
  add column if not exists case_mix_total_nurse_hours numeric(4,2),
  add column if not exists case_mix_rn_hours numeric(4,2),

  -- Additional quality metrics
  add column if not exists health_inspection_rating numeric(2,1),
  add column if not exists quality_measure_rating numeric(2,1),

  -- Number of health deficiencies
  add column if not exists number_of_facility_reported_incidents integer,
  add column if not exists number_of_substantiated_complaints integer,

  -- Number of certified beds (already exists as total_beds, but adding for clarity)
  add column if not exists number_of_certified_beds integer;

-- Add indexes for filtering by staffing quality
create index if not exists idx_resources_staffing_rating on resources (staffing_rating) where staffing_rating is not null;
create index if not exists idx_resources_total_nurse_hours on resources (total_nurse_hours_per_resident_per_day) where total_nurse_hours_per_resident_per_day is not null;
create index if not exists idx_resources_rn_hours on resources (rn_hours_per_resident_per_day) where rn_hours_per_resident_per_day is not null;

-- Add comment explaining these columns
comment on column resources.staffing_rating is 'Medicare 5-star staffing rating (nursing homes only)';
comment on column resources.total_nurse_hours_per_resident_per_day is 'Total nurse staffing hours per resident per day';
comment on column resources.rn_hours_per_resident_per_day is 'Registered Nurse hours per resident per day';
comment on column resources.total_nurse_staff_turnover is 'Percentage of nursing staff who left in past 12 months';
