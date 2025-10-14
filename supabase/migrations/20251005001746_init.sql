-- Enable required extensions
create extension if not exists "pgcrypto" with schema public;

-- Resources catalog
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Core Info
  title text not null,
  url text not null,
  description text not null,
  best_for text,

  -- Categorization
  category text[] not null,
  conditions text[] not null,
  urgency_level text not null,

  -- Location
  location_type text not null,
  states text[],
  requires_zip boolean default false,

  -- Audience
  audience text[] not null,
  living_situation text[],

  -- Resource Details
  cost text not null,
  contact_phone text,
  contact_email text,
  hours_available text,

  -- Monetization
  affiliate_url text,
  affiliate_network text,
  is_sponsored boolean default false,

  -- Metadata
  source_authority text not null,
  last_verified timestamptz,
  click_count integer default 0,
  upvotes integer default 0,

  -- Search
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(best_for, ''))
  ) stored
);

create index if not exists idx_resources_category on resources using gin (category);
create index if not exists idx_resources_conditions on resources using gin (conditions);
create index if not exists idx_resources_urgency on resources (urgency_level);
create index if not exists idx_resources_location on resources (location_type);
create index if not exists idx_resources_search on resources using gin (search_vector);

-- Anonymous user session capture (no auth for MVP)
create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- User Context (from navigator)
  relationship text,
  conditions text[] not null,
  zip_code text,
  city text,
  state text,
  living_situation text not null,
  urgency_factors text[] not null,

  -- Contact (optional)
  email text,
  email_subscribed boolean default false,

  -- Generated Results
  matched_resources uuid[],
  ai_guidance text,

  -- Tracking
  completed_at timestamptz,
  resources_clicked uuid[],
  pdf_downloaded boolean default false,
  leads_submitted integer default 0
);

-- Leads routed to service providers
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  session_id uuid references user_sessions(id),
  lead_type text not null,

  -- Contact Info
  name text not null,
  email text not null,
  phone text,

  -- Context
  zip_code text not null,
  message text,
  urgency text,

  -- Tracking
  sent_to_provider text,
  provider_notified_at timestamptz,
  status text default 'new'
);

-- Community validation / feedback loop
create table if not exists resource_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  resource_id uuid references resources(id) on delete cascade,
  session_id uuid references user_sessions(id),

  helpful boolean not null,
  comment text,

  ip_hash text,
  unique(resource_id, ip_hash)
);

-- TODO: add Row Level Security policies once Supabase project is provisioned.
