# SunsetWell Scoring Methodology (v2.3)

**Status:** ✅ Verified on 2025-10-14  
**Scope:** Medicare-certified skilled nursing facilities (14,752 facilities)  
**Artifacts:**
- `analysis/scoring/v2_3_weights.json`
- `data/cms/processed/sunsetwell-scores-v2_3.csv`
- `analysis/scoring/v2_3_evaluation.json`

---

## Executive Summary

SunsetWell v2.3 predicts avoidable harm by combining inspection severity, staffing depth, long-stay MDS outcomes, and complaint/incident rates. The score is an absolute 0–100 measure accompanied by a peer percentile. All inputs and transforms are versioned and reproducible.

- **Absolute score (`overall_score`)** – higher is safer; calibrated against PHI labels.
- **Peer percentile (`overall_percentile`)** – ranks a facility within its state/division + size/ownership peer group.
- **Coverage** – 100% of SNFs (14,752 facilities) now receive a score.

---

## Data Sources

| Dataset | Purpose |
| --- | --- |
| `resources` (Supabase) | Core CMS star ratings, staffing hours, turnover, incidents/complaints, bed counts |
| `data/cms/processed/quality-metrics-processed.csv` | Long-stay MDS harm measures (codes 410, 479, 451, 430, 404, 434, 406, 480) |
| `data/cms/processed/deficiencies-processed.csv` | Inspection scope/severity records used to build severity index and counts |
| `data/cms/processed/penalties-processed.csv` | CMP totals per facility (currently sparse; dropped for v2.3 due to missingness) |
| `analysis/scoring/phi_labels.csv` | Training labels (0–100 predicted harm) |

Feature hydration & aggregation live in `scripts/scoring/feature-utils.ts` so training and scoring share identical data prep.

---

## Feature Groups & Handling

| Group | Features | Notes |
| --- | --- | --- |
| Inspection & Enforcement | `deficiency_severity_index`, `deficiency_total_count` | Severity index sums scope/severity codes (A–L mapped 1/2/4/0). `deficiency_ij_count` retained for future once completeness improves. |
| Staffing Capacity | RN/LPN/CNA hours, weekend coverage, total turnover, bed count | RN turnover remains below completeness threshold (86%) and is excluded automatically. |
| Outcomes (MDS) | `mds_410`, `mds_479`, `mds_451`, `mds_430`, `mds_404`, `mds_434`, `mds_406`, `mds_480` | Scores pulled from processed quality metrics; higher = more harm (features are inverted during calibration). |
| Complaint & Incident Rates | `number_of_facility_reported_incidents`, `number_of_substantiated_complaints`, facility/state per-bed rates | Facility per-bed rates give scale invariance; state rates provide market baseline. |

**Missing Data Policy**
- Drop any feature with >10% missing values (logged during training).
- Median-impute remaining nulls (values stored in `impute` block of the weights file).
- Robust scaling uses per-feature P5/P95 to cap outlier influence.

---

## Training Workflow (`scripts/train-v2_3-weights.ts`)

1. Load PHI labels and facility predictors (Supabase + CSV extras).
2. Compute coverage & drop high-missingness features (rn_turnover, IJ counts, CMP totals dropped for v2.3).
3. Impute + scale survivors to [0,1]; store medians and percentile bounds.
4. Optimize weights toward equal prior (projected simplex) with L2 regularization.
5. Calibrate composite → PHI using linear regression; store `phi_p5` & `phi_p95` for scoring time.
6. Write `analysis/scoring/v2_3_weights.json` with predictors, weights, impute map, scaling, and calibration metadata.

---

## Score Computation (`scripts/calculate-sunsetwell-scores-v2_3.ts`)

1. Read weight configuration and hydrate features using shared utilities.
2. Impute + scale with the stored medians/percentiles.
3. Compute weighted composite and transform to 0–100 via PHI quantiles:
   ```ts
   const phiHat = intercept + slope * composite;
   const score = clamp01((phi_p95 - phiHat) / (phi_p95 - phi_p5)) * 100;
   ```
4. Build state-level percentiles (fallback to division/national when sample < 30).
5. Emit CSV (`data/cms/processed/sunsetwell-scores-v2_3.csv`). Optional upsert to Supabase can be re-enabled when schema is ready.

---

## Validation

Run `pnpm tsx scripts/evaluate-v2_3-vs-proxies.ts` to compare scores against complaint & incident proxies.

| Proxy | SunsetWell v2.3 | CMS Overall | Sample |
| --- | --- | --- | --- |
| Complaints (raw) | Spearman 0.587 | Spearman 0.598 | 14,608 |
| Incidents (raw) | Spearman 0.484 | Spearman 0.527 | 14,608 |
| Complaints (per 100 beds) | Spearman 0.625 | Spearman 0.556 | 14,608 |
| Incidents (per 100 beds) | Spearman 0.530 | Spearman 0.511 | 14,608 |

> SunsetWell now matches or outperforms CMS stars on every per-bed proxy and delivers materially higher correlations than the legacy v2.2 harm composite (Spearman ≈0.42 complaints, 0.39 incidents).

---

## Reproducibility Checklist

```bash
# 1. Train weights (writes v2_3_weights.json)
pnpm tsx scripts/train-v2_3-weights.ts

# 2. Generate fresh scores (writes sunsetwell-scores-v2_3.csv)
pnpm tsx scripts/calculate-sunsetwell-scores-v2_3.ts

# 3. Evaluate vs. proxies (writes v2_3_evaluation.json)
pnpm tsx scripts/evaluate-v2_3-vs-proxies.ts

# 4. Sanity check coverage
grep -c "" data/cms/processed/sunsetwell-scores-v2_3.csv  # expect 14,753 (header + rows)
```

---

## Known Gaps & Next Steps

- **Penalty depth** – CMP fine amounts are only present for ~52% of facilities; as completeness improves we can reinstate this feature.
- **Immediate jeopardy counts** – Many CMS records omit IJ indicators; revisit once data quality improves.
- **Modalities beyond SNFs** – Assisted living and home health scoring pipelines require their own feature engineering and labels.
- **Explainability UI** – Expose top contributing metrics (e.g., highest harm MDS feature) in facility detail pages.

---

For historical reference, see `docs/SCORING-CHANGELOG.md` and archived methodology notes in `docs/ARCHIVE/`.
