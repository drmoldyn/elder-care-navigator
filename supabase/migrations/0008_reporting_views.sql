-- 0008_reporting_views.sql
-- Read models for demand insights

create view if not exists view_session_demand as
select
  date(created_at) as session_date,
  state,
  care_type,
  count(*) as session_count,
  count(case when email is not null then 1 end) as email_captures
from user_sessions
group by session_date, state, care_type;

comment on view view_session_demand is 'Daily session volume by state and care type.';

create view if not exists view_lead_conversion as
select
  date(created_at) as lead_date,
  facility_id,
  count(*) as lead_count
from info_requests
group by lead_date, facility_id;

comment on view view_lead_conversion is 'Aggregated lead submissions per facility per day.';
