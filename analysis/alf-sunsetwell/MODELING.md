# ALF Scoring (CA + FL + TX + CO + NY + MN Cohort)

## Dataset Sources
- `data/state/ca/alf-processed_20251012.csv` – California RCFE roster (licensing + capacity, limited services).
- `data/state/fl/alf-processed_20251012.csv` – Florida HealthFinder export merged with feature metrics.
- `data/state/tx/alf-processed_20251012.csv` – HHSC assisted living directory (active licenses only).
- `data/state/co/alf-processed_20251013.csv` – CDPHE assisted living residences (licensing + geocodes, no enforcement metrics).
- `data/state/ny/alf-processed_20251013.csv` – Health Data NY roster + certification merge (licensing + capacity, no enforcement).
- `data/state/mn/alf-processed_20251014.csv` – Minnesota Assisted Living Report Card (licensing status, capacity, lat/long; no enforcement data).
- `analysis/alf-sunsetwell/data/alf_ca_fl_tx_co_ny_mn_20251014.csv` – unified table for modeling.

## Feature Families (initial)
1. **Regulatory exposure** – complaint counts, sanction counts, fine amounts, deficiency class totals (FL only; treat CA/TX/CO/NY/MN as missing).
2. **Capacity & scale** – licensed capacity, facility size percentiles.
3. **Service richness** – activities_count/list, nurse availability, specialty programs (FL only, imputed to CA/TX/CO/NY/MN via k-NN over UMAP).
4. **Licensing stability** – license_status, issue/expiration dates (CA/TX/CO/NY/MN provide tenure; FL lacks issue dates).
5. **Location context** – state, county, ZIP (for peer grouping). Lat/long now available from CO/NY/MN feeds and imputed via geocoding for FL/TX when needed.

## Modeling Phases
1. **Profiling & completeness** – quantify missingness per feature/state, derive state flags for UMAP masking.
2. **UMAP embeddings** – project facilities using standardized features; evaluate neighborhood coherence (within-state vs cross-state).
3. **Feature importance** – identify dimensions driving separability (e.g., compute SHAP on downstream regressors or correlation with outcome proxies).
4. **Scoring prototype** – translate embeddings + raw metrics into weighted percentiles (initially two-state).
5. **Generalization tests** – hold out a subset of counties or facility types to simulate “new state” onboarding.

## Open Questions
- What proxy outcomes can we use for CA (lacking deficiency data)? Options: create semi-supervised target from FL and transfer via embedding distance.
- How to impute missing FL service features for CA without overfitting? Candidate: use k-NN in embedding space with uncertainty scores.
- Peer group definition: state + capacity buckets vs UMAP-driven clusters?

## Next Deliverables
- Notebook: data profiling + completeness heatmaps.
- Notebook: UMAP pipeline (feature prep, scaling, embedding, visualization).
- Draft scoring spec: component weights, percentile logic, confidence tagging for imputed dimensions.
