-- 0014_facility_scores.sql
-- Tables to support normalized facility metrics and composite scores

create table if not exists facility_metric_weights (
    id uuid primary key default gen_random_uuid(),
    version text not null,
    provider_type text not null,
    metric_key text not null,
    weight numeric not null,
    region text,
    created_at timestamptz not null default now(),
    unique (version, provider_type, metric_key, coalesce(region, 'GLOBAL'))
);

create table if not exists facility_metrics_normalized (
    id uuid primary key default gen_random_uuid(),
    facility_id uuid not null references resources(id) on delete cascade,
    metric_key text not null,
    raw_value numeric,
    z_score numeric,
    percentile numeric,
    mean numeric,
    std_dev numeric,
    provider_type text not null,
    region text,
    score_version text not null,
    calculated_at timestamptz not null default now(),
    unique (facility_id, metric_key, score_version)
);

create table if not exists facility_scores (
    id uuid primary key default gen_random_uuid(),
    facility_id uuid not null references resources(id) on delete cascade,
    score numeric not null,
    provider_type text not null,
    region text,
    version text not null,
    calculated_at timestamptz not null default now(),
    unique (facility_id, version)
);

comment on table facility_metric_weights is 'Weight coefficients for each normalized metric by provider type/region and model version.';
comment on table facility_metrics_normalized is 'Z-scores and percentiles for facility metrics within peer groups.';
comment on table facility_scores is 'Composite SunsetWell scores per facility and model version.';
