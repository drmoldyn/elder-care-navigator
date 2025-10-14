# Codex Task Briefing — SunsetWell Scoring (v2.3)

**Repository Root:** `/Users/dtemp/Desktop/nonnie-world`

This document summarises the current scoring system so an assistive LLM can reason about the project without extra context.

---

## 1. Current State (2025‑10‑14)

- **Score version:** v2.3 "Predictive Harm" (see `analysis/scoring/v2_3_weights.json`).
- **Coverage:** 14,752 / 14,752 Medicare-certified nursing homes now score successfully (100%).
- **Pipeline scripts:**
  - `scripts/train-v2_3-weights.ts` — trains model weights against PHI harm labels.
  - `scripts/calculate-sunsetwell-scores-v2_3.ts` — generates scores using shared feature loaders.
  - `scripts/scoring/feature-utils.ts` — hydrates supplemental CMS metrics (MDS harm measures, deficiency severity index, complaint/incident rates, state benchmarks).
  - `scripts/evaluate-v2_3-vs-proxies.ts` — benchmarks scores vs. complaint/incident proxies.
- **Evaluation:** Current release outperforms CMS stars on complaint/incident correlations (Spearman ≈ 0.59 and 0.48 respectively).
- **Documentation:** `README.md`, `docs/SCORING-CHANGELOG.md`, `docs/SCORING-METHODOLOGY-V2.md`, and `docs/SCORING-COVERAGE-SUMMARY.md` describe the new pipeline and coverage.

---

## 2. Data Sources & Features

| Source | Purpose |
| --- | --- |
| Supabase `resources` | Core CMS star ratings, staffing hours, turnover, incident/complaint counts, bed counts |
| `data/cms/processed/quality-metrics-processed.csv` | Long-stay MDS harm measures (codes 410, 479, 451, 430, 404, 434, 406, 480) |
| `data/cms/processed/deficiencies-processed.csv` | Inspection scope/severity per citation (build severity index & counts) |
| `data/cms/processed/penalties-processed.csv` | CMP totals (currently sparse; dropped from v2.3) |
| `data/cms/processed/nursing-homes-processed.csv` | Bed counts, raw incidents/complaints, state arrays |
| `analysis/scoring/phi_labels.csv` | Training labels (predictive harm)

Feature hydration is centralised in `scripts/scoring/feature-utils.ts`; both training and scoring call `loadExtraFacilityFeatures()` and `getFeatureValue()` to ensure parity.

---

## 3. Commands

```bash
# Train / refresh weights
pnpm tsx scripts/train-v2_3-weights.ts

# Generate scores (writes data/cms/processed/sunsetwell-scores-v2_3.csv)
pnpm tsx scripts/calculate-sunsetwell-scores-v2_3.ts

# Evaluate vs. complaints/incidents
dpnm tsx scripts/evaluate-v2_3-vs-proxies.ts
```

Outputs:
- `analysis/scoring/v2_3_weights.json` (predictors, weights, scaling, imputation, calibration)
- `data/cms/processed/sunsetwell-scores-v2_3.csv`
- `analysis/scoring/v2_3_evaluation.json`

---

## 4. Open Work / Next Releases

1. **Penalty & IJ completeness** — Re-ingest CMS penalty/IJ indicators when quality improves and reintroduce them to the feature set.
2. **Assisted Living & Home Health scoring** — Adapt v2.3 pipeline to other modalities; source labels and provider-specific predictors.
3. **Explainability UI** — Surface top contributing features (e.g., highest harm MDS metric) in facility detail pages.
4. **Historical trends** — Persist score snapshots for delta alerts.

---

## 5. Key References

- `docs/scoring-model.md` — Narrative overview of v2.3.
- `docs/SCORING-CHANGELOG.md` — Release history.
- `docs/SCORING-COVERAGE-SUMMARY.md` — Coverage counts & pipeline steps.
- `docs/SUNSETWELL-IMPROVEMENT-ROADMAP.md` — Roadmap for product & data enhancements.

Use this briefing as the authoritative context before modifying the scoring system.
