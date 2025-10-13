create table if not exists public.zip_geocode_cache (
  zip text primary key,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz not null default timezone('utc', now()),
  error_status text,
  error_message text
);

create index if not exists idx_zip_geocode_cache_updated_at on public.zip_geocode_cache(updated_at);
