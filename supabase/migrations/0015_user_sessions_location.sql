alter table user_sessions
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists search_radius_miles integer;

create index if not exists idx_user_sessions_location on user_sessions(latitude, longitude);
