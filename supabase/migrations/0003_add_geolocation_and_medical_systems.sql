-- Enable PostGIS extension for geospatial calculations
create extension if not exists "postgis" with schema public;

-- Add geolocation fields to resources table
alter table resources
  add column if not exists street_address text,
  add column if not exists city text,
  add column if not exists zip_code text,
  add column if not exists county text,
  add column if not exists latitude decimal(10, 8),
  add column if not exists longitude decimal(11, 8),
  add column if not exists geolocation geography(Point, 4326);

-- Add insurance coverage fields
alter table resources
  add column if not exists medicare_accepted boolean default false,
  add column if not exists medicaid_accepted boolean default false,
  add column if not exists private_insurance_accepted boolean default false,
  add column if not exists veterans_affairs_accepted boolean default false,
  add column if not exists insurance_notes text;

-- Add provider identification fields
alter table resources
  add column if not exists facility_id text, -- CMS CCN, state license number, or NPI
  add column if not exists npi text, -- National Provider Identifier
  add column if not exists provider_type text; -- nursing_home, assisted_living, home_health, hospice, adult_day_care, hospital

-- Add facility characteristics
alter table resources
  add column if not exists total_beds integer,
  add column if not exists ownership_type text, -- for_profit, non_profit, government
  add column if not exists quality_rating decimal(3, 2), -- CMS 5-star rating
  add column if not exists services_offered text[], -- array of services
  add column if not exists specialties text[]; -- array of specialties

-- Create major medical systems table
create table if not exists medical_systems (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Hospital Info
  name text not null,
  cms_provider_id text, -- CMS Certification Number (CCN)
  npi text,

  -- Location
  street_address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  county text,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  geolocation geography(Point, 4326) not null,

  -- Classification
  hospital_type text not null, -- acute_care, critical_access, childrens, va, dod
  bed_count integer,
  is_teaching_hospital boolean default false,
  trauma_level text, -- level_1, level_2, level_3, level_4, null
  academic_affiliation text, -- university/medical school name

  -- Contact
  phone text,
  website text,

  -- Metadata
  cms_quality_rating decimal(3, 2),
  last_verified timestamptz
);

-- Create proximity relationships table (precomputed for performance)
create table if not exists resource_medical_proximity (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  resource_id uuid references resources(id) on delete cascade,
  medical_system_id uuid references medical_systems(id) on delete cascade,

  distance_miles decimal(6, 2) not null, -- distance in miles
  drive_time_minutes integer, -- optional: driving time estimate

  constraint unique_resource_medical unique(resource_id, medical_system_id)
);

-- Create indexes for geolocation queries
create index if not exists idx_resources_geolocation on resources using gist (geolocation);
create index if not exists idx_resources_zip on resources (zip_code);
create index if not exists idx_resources_city_state on resources (city, state);
create index if not exists idx_resources_insurance on resources (medicare_accepted, medicaid_accepted, private_insurance_accepted, veterans_affairs_accepted);
create index if not exists idx_resources_provider_type on resources (provider_type);
create index if not exists idx_resources_npi on resources (npi);
create index if not exists idx_resources_facility_id on resources (facility_id);

create index if not exists idx_medical_systems_geolocation on medical_systems using gist (geolocation);
create index if not exists idx_medical_systems_state on medical_systems (state);
create index if not exists idx_medical_systems_type on medical_systems (hospital_type);
create index if not exists idx_medical_systems_teaching on medical_systems (is_teaching_hospital);
create index if not exists idx_medical_systems_trauma on medical_systems (trauma_level) where trauma_level is not null;

create index if not exists idx_proximity_resource on resource_medical_proximity (resource_id);
create index if not exists idx_proximity_medical on resource_medical_proximity (medical_system_id);
create index if not exists idx_proximity_distance on resource_medical_proximity (distance_miles);

-- Function to automatically update geolocation from lat/long
create or replace function update_geolocation_from_coords()
returns trigger as $$
begin
  if NEW.latitude is not null and NEW.longitude is not null then
    NEW.geolocation := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Triggers to auto-update geolocation
create trigger resources_update_geolocation
  before insert or update of latitude, longitude on resources
  for each row
  execute function update_geolocation_from_coords();

create trigger medical_systems_update_geolocation
  before insert or update of latitude, longitude on medical_systems
  for each row
  execute function update_geolocation_from_coords();

-- Function to calculate distance between two geography points in miles
create or replace function calculate_distance_miles(geo1 geography, geo2 geography)
returns decimal(6, 2) as $$
begin
  return (ST_Distance(geo1, geo2) * 0.000621371)::decimal(6, 2); -- meters to miles
end;
$$ language plpgsql immutable;

-- Function to find medical systems within radius (miles)
create or replace function find_medical_systems_within_radius(
  target_lat decimal,
  target_lon decimal,
  radius_miles decimal default 120
)
returns table (
  id uuid,
  name text,
  distance_miles decimal,
  hospital_type text,
  is_teaching_hospital boolean,
  trauma_level text,
  city text,
  state text
) as $$
begin
  return query
  select
    ms.id,
    ms.name,
    calculate_distance_miles(
      ST_SetSRID(ST_MakePoint(target_lon, target_lat), 4326)::geography,
      ms.geolocation
    ) as distance_miles,
    ms.hospital_type,
    ms.is_teaching_hospital,
    ms.trauma_level,
    ms.city,
    ms.state
  from medical_systems ms
  where ST_DWithin(
    ST_SetSRID(ST_MakePoint(target_lon, target_lat), 4326)::geography,
    ms.geolocation,
    radius_miles * 1609.34 -- miles to meters
  )
  order by distance_miles asc;
end;
$$ language plpgsql;

-- Function to precompute proximity relationships for a resource
create or replace function compute_resource_medical_proximity(
  resource_uuid uuid,
  radius_miles decimal default 120
)
returns integer as $$
declare
  resource_rec record;
  inserted_count integer := 0;
begin
  -- Get resource location
  select latitude, longitude into resource_rec
  from resources
  where id = resource_uuid and latitude is not null and longitude is not null;

  if not found then
    return 0;
  end if;

  -- Delete existing proximity records
  delete from resource_medical_proximity where resource_id = resource_uuid;

  -- Insert new proximity records
  insert into resource_medical_proximity (resource_id, medical_system_id, distance_miles)
  select
    resource_uuid,
    ms.id,
    calculate_distance_miles(
      ST_SetSRID(ST_MakePoint(resource_rec.longitude, resource_rec.latitude), 4326)::geography,
      ms.geolocation
    )
  from medical_systems ms
  where ST_DWithin(
    ST_SetSRID(ST_MakePoint(resource_rec.longitude, resource_rec.latitude), 4326)::geography,
    ms.geolocation,
    radius_miles * 1609.34 -- miles to meters
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$ language plpgsql;

-- Update timestamp trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Add update triggers
create trigger resources_update_timestamp
  before update on resources
  for each row
  execute function update_updated_at();

create trigger medical_systems_update_timestamp
  before update on medical_systems
  for each row
  execute function update_updated_at();
