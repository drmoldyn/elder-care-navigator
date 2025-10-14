-- Add reliability and uncertainty fields to SunsetWell scores

alter table if exists sunsetwell_scores
  add column if not exists reliability_weight numeric,
  add column if not exists reliability_label text,
  add column if not exists score_ci_lower numeric(5,2),
  add column if not exists score_ci_upper numeric(5,2);

comment on column sunsetwell_scores.reliability_weight is '0..1 weight indicating stability of the score based on data coverage';
comment on column sunsetwell_scores.reliability_label is 'high / moderate / low reliability category based on reliability_weight';
comment on column sunsetwell_scores.score_ci_lower is 'Lower bound of a simple uncertainty interval for the absolute score (informational)';
comment on column sunsetwell_scores.score_ci_upper is 'Upper bound of a simple uncertainty interval for the absolute score (informational)';
