# SunsetWell Scoring Model (v2.3)

**Last updated:** 2025-10-14  
**Current release:** v2.3 "Predictive Harm"  
**Coverage:** 14,752 / 14,752 Medicare-certified nursing homes (100%)  
**Primary objective:** Predict avoidable harm by combining inspection severity, staffing depth, clinical outcomes, and complaint/incident rates into an interpretable 0–100 score with peer percentile context.

---

## 1. Objectives

1. Deliver an **absolute quality score (0–100)** that predicts patient harm better than individual CMS star ratings.
2. Provide a **peer percentile (0–100)** so families can compare similar facilities instantly.
3. Maintain a **fully reproducible, auditable pipeline** with versioned configuration (`analysis/scoring/v2_3_weights.json`).
4. Preserve **transparency and explainability**: every feature can be surfaced in UI tooltips and marketing materials.

---

## 2. Feature Set

v2.3 consumes 27 predictors spanning four domains. All features are available for every nursing home via Supabase (`resources` table) or the processed CMS CSVs in `data/cms/processed/`.

| Domain | Features (examples) | Source |
| --- | --- | --- |
| Inspection & Enforcement | Deficiency severity index, deficiency total count | `deficiencies-processed.csv`
| Staffing Depth & Stability | RN/LPN/CNA hours, weekend coverage, total nurse turnover, certified beds | `resources`
| Patient Outcomes (MDS) | Falls (410), Pressure injuries (479), Antipsychotics (451), UTIs (430), Weight loss (404), Depressive symptoms (434), Catheters (406), Incontinence (480) | `quality-metrics-processed.csv`
| Complaint & Incident Rates | Facility per-bed complaints/incidents, state per-bed benchmarks, incident/complaint counts | `nursing-homes-processed.csv`

Features with >10% missing data are automatically dropped at training time (e.g., RN turnover, IJ counts). Remaining nulls are median-imputed (stored in `impute` section of the weights file).

> **Shared loader:** `scripts/scoring/feature-utils.ts` hydrates all derived features for both training and scoring.

---

## 3. Training Pipeline

Script: `pnpm tsx scripts/train-v2_3-weights.ts`

1. **Load PHI labels** from `analysis/scoring/phi_labels.csv` (0–100, higher = more harm).
2. **Fetch base metrics** from Supabase (`resources`) with deterministic pagination (`.order('facility_id')`).
3. **Load supplemental features** from processed CMS CSVs via `loadExtraFacilityFeatures()`.
4. **Filter predictors**: drop any feature with >10% missingness; store medians + P5/P95 scaling values for the survivors.
5. **Impute + normalize** survivors to [0,1] with robust percentile scaling.
6. **Optimize weights** using regularized gradient descent toward an equal-weight prior projected to the simplex.
7. **Calibrate**: map the weighted composite back to the PHI target distribution (store `phi_p5` / `phi_p95` for scoring time).
8. **Persist configuration** to `analysis/scoring/v2_3_weights.json`:
   ```json
   {
     "predictors": [...],
     "weights": [...],
     "impute": {...},
     "scaling": {"p5": [...], "p95": [...]},
     "calibration": {"phi_p5": 0.26, "phi_p95": 0.59}
   }
   ```

---

## 4. Score Calculation

Script: `pnpm tsx scripts/calculate-sunsetwell-scores-v2_3.ts`

1. Load the training configuration described above.
2. Fetch all nursing homes from Supabase with deterministic pagination (avoids the 1000-row limit).
3. Hydrate derived features with `loadExtraFacilityFeatures()` and merge with Supabase fields.
4. Apply median imputation and [P5,P95] scaling identical to training (shared config ensures reproducibility).
5. Compute the weighted composite (`Σ weight × normalized_feature`).
6. Convert the composite to an absolute score using PHI calibration: `score = clamp01((phi_p95 - phi_hat)/phi_range) × 100`.
7. Compute peer percentiles within state + provider groups.
8. Write results to `data/cms/processed/sunsetwell-scores-v2_3.csv` (and optionally upsert to `sunsetwell_scores` if enabled).

**Output columns**:
- `facility_id`
- `overall_score` (0–100, higher = safer)
- `overall_percentile`
- `calculation_date`
- `version` (`"v2.3"`)

---

## 5. Coverage & Validation

- **Coverage:** 14,752 / 14,752 nursing homes now score successfully (100%). Assisted living remains at 39,463 / 44,636 (88.4%).
- **Evaluation:** `pnpm tsx scripts/evaluate-v2_3-vs-proxies.ts` benchmarks scores against complaint & incident proxies. Current release (2025-10-14) delivers Spearman ≈0.59 vs complaints and ≈0.48 vs incidents, outperforming CMS overall & inspection stars.
- **Artifacts:**
  - `data/cms/processed/sunsetwell-scores-v2_3.csv`
  - `analysis/scoring/v2_3_evaluation.json`
  - `analysis/scoring/v2_3_weights.json`

---

## 6. Peer Percentiles

Percentiles are calculated within state-level peer groups (fallbacks to Census division or national sample if small). We continue to apply modest shrinkage toward group means before ranking, based on staffing availability and MDS denominator volume.

---

## 7. Reproducibility Checklist

| Step | Command |
| --- | --- |
| Train weights | `pnpm tsx scripts/train-v2_3-weights.ts` |
| Generate scores | `pnpm tsx scripts/calculate-sunsetwell-scores-v2_3.ts` |
| Evaluate | `pnpm tsx scripts/evaluate-v2_3-vs-proxies.ts` |
| Spot-check coverage | `python data/scripts/count_scores.py` (example snippet) |

All scripts log dropped features and write imputation/scaling metadata for traceability. Rerunning the pipeline from scratch should reproduce current CSVs when using the same input datasets.

---

## 8. Roadmap

1. **Deficiency IJ & CMP suspension data** – enrich pipeline to capture IJ frequency and payment denial duration once CMS data completeness improves.
2. **Assisted living & home health scoring** – adapt the v2.3 pipeline with modality-specific features and labels.
3. **Historical trend analysis** – persist monthly snapshots for change detection and alerts.
4. **Explainability UI** – expose top drivers (e.g., worst MDS harm metric) alongside the new score.

---

## 9. Reference Scripts

- `scripts/train-v2_3-weights.ts`
- `scripts/calculate-sunsetwell-scores-v2_3.ts`
- `scripts/scoring/feature-utils.ts`
- `scripts/evaluate-v2_3-vs-proxies.ts`
- `scripts/normalize-facility-metrics.ts` (legacy; still used for Assisted Living v1 pipeline)

---

For historical context, see `docs/SCORING-CHANGELOG.md` and `docs/ARCHIVE/deprecated/scoring-model-OLD-20251013.md`.
