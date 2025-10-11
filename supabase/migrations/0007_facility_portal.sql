-- 0007_facility_portal.sql
-- Schema additions to support the facility partner portal

create table if not exists facility_accounts (
    id uuid primary key default gen_random_uuid(),
    facility_id uuid not null references resources(id) on delete cascade,
    contact_name text,
    contact_email text not null,
    contact_phone text,
    role text not null default 'admin',
    status text not null default 'pending',
    invite_token uuid,
    last_signed_in_at timestamptz,
    notify_email boolean not null default true,
    notify_sms boolean not null default false,
    notification_email text,
    notification_phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists facility_accounts_unique_email
    on facility_accounts (facility_id, contact_email);

create table if not exists facility_claim_requests (
    id uuid primary key default gen_random_uuid(),
    facility_id uuid not null references resources(id) on delete cascade,
    requester_name text,
    requester_email text not null,
    requester_phone text,
    message text,
    status text not null default 'pending',
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewer_id uuid
);

create table if not exists facility_availability_updates (
    id uuid primary key default gen_random_uuid(),
    facility_id uuid not null references resources(id) on delete cascade,
    account_id uuid references facility_accounts(id) on delete set null,
    beds_available integer,
    waitlist_weeks integer,
    accepts_medicaid boolean,
    accepts_medicare boolean,
    accepts_private_pay boolean,
    notes text,
    created_at timestamptz not null default now()
);

alter table facility_accounts enable row level security;
alter table facility_claim_requests enable row level security;
alter table facility_availability_updates enable row level security;

comment on table facility_accounts is 'Authorized users representing facilities within the portal.';
comment on table facility_claim_requests is 'Incoming claims from facilities requesting access to their profile.';
comment on table facility_availability_updates is 'Self-reported availability snapshots submitted by facility accounts.';

-- Baseline policies (service role bypasses, but keep explicit for clarity)
create policy if not exists facility_accounts_service_role
  on facility_accounts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists facility_claim_requests_service_role
  on facility_claim_requests for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy if not exists facility_availability_updates_service_role
  on facility_availability_updates for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
