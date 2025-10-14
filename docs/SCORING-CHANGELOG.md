# SunsetWell Scoring Changelog

This file documents user‑visible changes to the SunsetWell scoring system.

## 2025‑10‑14 — v2.3 (Predictive Harm, Full SNF Coverage)

- Introduced a predictive harm model trained on PHI labels that blends inspection severity, staffing depth/stability, long-stay MDS harm measures, per-bed complaint & incident rates, and market benchmarks.
- Achieved **100% coverage of 14,752 nursing homes** by imputing median values for sparse metrics and dropping only features with >10% missingness (e.g., RN turnover, IJ counts).
- Added facility/state per-bed complaint & incident rates, deficiency severity index, MDS harm measures (410/479/451/430/404/434/406/480), and certified bed count to the feature set.
- Refactored scoring scripts to ingest supplemental CSVs through `scripts/scoring/feature-utils.ts`; both training and scoring now share the same feature hydration logic.
- Calibration updated to map predicted harm quantiles to the 0–100 scale; refreshed evaluation shows SunsetWell v2.3 outperforming CMS stars on complaints & incidents (Spearman ≈0.58 and 0.48 nationally).
- Documentation refreshed across README, scoring methodology, and roadmap to reflect the new pipeline.

## 2025‑10‑13 — v2 (Absolute Score + Peer Percentile)

- SunsetWell Score now computed as an absolute 0–100 composite from raw metrics, not peer‑normalized z‑scores.
  - Stars mapped to 0–100; nurse hours scaled; turnover/deficiency/penalty metrics inverted; booleans mapped to 0/100.
  - Weights updated to include inspection depth: `deficiency_count`, `total_penalties_amount`, and `has_immediate_jeopardy`.
- Percentile Rank is computed within peer groups (state/division + size/ownership) from the absolute score, with modest reliability‑aware shrinkage for ranking only.
- `sunsetwell_scores` now populated with component scores (safety/staffing/quality) and per‑metric percentiles (`metric_percentiles`).
- Documentation updated; prior z‑score language removed/archived. See docs/scoring-model.md.

## 2025‑10‑10 — v1.x

- Initial composite used weighted z‑scores and mapped to 0–100; percentiles were sometimes conflated with the score.
- This approach is deprecated and archived.

## Upcoming — v2.1 (Optimized Weights)

- Add script to optimize metric weights against long‑stay hospitalization (primary) and ED visits (secondary) with cross‑validation and regularization toward prior weights.
  - Script: `scripts/optimize-weights.ts`
  - Persist with: `NEW_SCORE_VERSION=v2.1 APPLY_WEIGHTS=true pnpm tsx scripts/optimize-weights.ts`
- To apply v2.1 weights in scoring, set `METRIC_SCORE_VERSION=v2.1` and run `scripts/calculate-sunsetwell-scores-full.ts`.
- Division-level overrides: when validation improves materially within a Census division, store overrides as `region='DIV:<division_code>'`. The scorer now falls back to division keys if no state-specific override is present.

## 2025‑10‑13 — v2.2 (Harm‑Weighted Safety Composite)

- Primary endpoint updated to a harm‑weighted safety composite (absolute 0–100) using:
  - Long‑stay MDS quality measures indicative of harm (falls with injury, pressure ulcers, antipsychotics, UTI, weight loss, depressive symptoms, catheters, incontinence),
  - Inspection severity (deficiency severity index, immediate jeopardy flags), and
  - Penalties (CMP $).
- Scores are normalized with robust percentiles (P5–P95) per component and combined (weights documented internally).
- Percentile rank computed within state for peer context.
- Artifact: `data/cms/processed/sunsetwell-scores-v2_2.csv`.
- Script: `scripts/calculate-sunsetwell-scores-v2_2.ts` (CSV output; optional DB upsert via `APPLY_DB_UPSERT=true`).
