#!/usr/bin/env python3
"""Rebuild the ALF SunsetWell analytical artifacts with multi-state data.

This script:

1. Locates the latest processed state licensing exports (CA, FL, TX, CO, NY, MN)
2. Combines them into a unified modeling table under analysis/alf-sunsetwell/data
3. Generates profiling summaries and missingness diagnostics
4. Computes UMAP features/embeddings and service imputations (k-NN over UMAP)
5. Recalculates prototype SunsetWell scores and sensitivity diagnostics

Run from the repository root:

    python analysis/alf-sunsetwell/scripts/rebuild_pipeline.py
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.neighbors import NearestNeighbors
from umap import UMAP


# ---------------------------------------------------------------------------
# Paths & configuration
# ---------------------------------------------------------------------------

SCRIPT_PATH = Path(__file__).resolve()
ANALYSIS_DIR = SCRIPT_PATH.parents[1]
REPO_ROOT = SCRIPT_PATH.parents[3]
STATE_DATA_DIR = REPO_ROOT / "data" / "state"
ANALYSIS_DATA_DIR = ANALYSIS_DIR / "data"

RUN_DATE = datetime.now(timezone.utc).replace(tzinfo=None)
RUN_STAMP = RUN_DATE.strftime("%Y%m%d")

STATE_CODES = {
    "ca": "CA",
    "fl": "FL",
    "tx": "TX",
    "co": "CO",
    "ny": "NY",
    "mn": "MN",
}

STATE_FILE_PREFIX = "alf_" + "_".join(STATE_CODES.keys())
COMBINED_FILENAME = f"{STATE_FILE_PREFIX}_{RUN_STAMP}.csv"

REG_COLS = [
    "complaint_count",
    "sanction_count",
    "fine_amount",
    "deficiencies_total",
    "deficiency_class1",
    "deficiency_class2",
    "deficiency_class3",
    "deficiency_class4",
]

SERVICE_COLS = [
    "activities_count",
    "nurse_availability_count",
    "special_programs_count",
]

NUMERIC_OPTIONAL = [
    "deficiency_unclassified",
    "licensed_capacity",
    "latitude",
    "longitude",
]


@dataclass
class StateFrame:
    state: str
    path: Path
    frame: pd.DataFrame


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------


def latest_state_file(state_code: str) -> Path:
    pattern_parent = STATE_DATA_DIR / state_code
    matches = sorted(pattern_parent.glob("alf-processed_*.csv"))
    if not matches:
        raise FileNotFoundError(
            f"No processed file found for state '{state_code}' in {pattern_parent}"
        )
    return matches[-1]


def load_state_frame(state_code: str) -> StateFrame:
    path = latest_state_file(state_code)
    df = pd.read_csv(path, dtype=str, low_memory=False)
    df.columns = [col.strip().lower() for col in df.columns]
    df["state"] = STATE_CODES[state_code]
    # Normalize blank strings to NaN for downstream numeric conversions
    df.replace({"": np.nan, "NA": np.nan, "N/A": np.nan, "None": np.nan}, inplace=True)
    return StateFrame(state=STATE_CODES[state_code], path=path, frame=df)


def ensure_columns(df: pd.DataFrame, columns: Iterable[str]) -> None:
    for col in columns:
        if col not in df.columns:
            df[col] = np.nan


def column_union(frames: Sequence[pd.DataFrame]) -> List[str]:
    cols: List[str] = []
    seen = set()
    for frame in frames:
        for col in frame.columns:
            if col not in seen:
                seen.add(col)
                cols.append(col)
    return cols


def ordered_columns(existing_path: Optional[Path], union_cols: Sequence[str]) -> List[str]:
    base: List[str] = []
    if existing_path and existing_path.exists():
        base = list(pd.read_csv(existing_path, nrows=0).columns)

    ordered = list(base)
    for col in union_cols:
        if col not in ordered:
            ordered.append(col)
    return ordered


def to_numeric(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce")


def service_confidence_from_dist(distances: np.ndarray) -> float:
    if len(distances) == 0:
        return 0.0
    mean_distance = float(np.mean(distances))
    # Empirically scale to ~0.1–0.2 for distant neighbors (CA/TX/CO) and ~1 for direct observations
    confidence = 1.0 / (1.0 + mean_distance)
    return max(0.1, min(1.0, confidence))


def tenure_score(issue_dates: pd.Series, status: pd.Series) -> pd.Series:
    issued = pd.to_datetime(issue_dates, errors="coerce")
    tenure_years = ((RUN_DATE - issued) / pd.Timedelta(days=365.25)).clip(lower=0)
    tenure_ratio = (tenure_years / 25.0).clip(upper=1.0)
    tenure_component = tenure_ratio.pow(0.8)  # diminishing returns after ~20 years

    status_map = {
        "ACTIVE": 1.0,
        "CURRENT": 1.0,
        "IN REVIEW": 0.6,
        "PENDING": 0.5,
        "INACTIVE": 0.2,
        "EXPIRED": 0.2,
        "SUSPENDED": 0.1,
        "REVOKED": 0.0,
        "CLOSED": 0.0,
    }

    status_norm = status.str.upper().map(status_map).fillna(0.4)
    score = tenure_component * status_norm
    # For missing issue dates, fall back to status weight only (scaled down to avoid optimistic bias)
    score = score.where(issued.notna(), status_norm * 0.4)
    return score.clip(lower=0.0, upper=1.0)


def percentile_scores(df: pd.Series) -> pd.Series:
    if df.dropna().empty:
        return pd.Series(np.nan, index=df.index)
    return df.rank(pct=True)


def safe_mean(series: pd.Series) -> float:
    return float(series.dropna().mean()) if not series.dropna().empty else float("nan")


# ---------------------------------------------------------------------------
# 1. Load and combine state data
# ---------------------------------------------------------------------------


state_frames: List[StateFrame] = []
for code in STATE_CODES:
    frame = load_state_frame(code)
    state_frames.append(frame)
    print(f"Loaded {len(frame.frame):>5} rows for {frame.state} from {frame.path.name}")

combined_frames = [sf.frame for sf in state_frames]

for df in combined_frames:
    # Guarantee expected numeric columns are present
    ensure_columns(df, REG_COLS + SERVICE_COLS + NUMERIC_OPTIONAL)

union_cols = column_union(combined_frames)
previous_files = sorted(ANALYSIS_DATA_DIR.glob(f"{STATE_FILE_PREFIX}_*.csv"))
previous_path = previous_files[-1] if previous_files else None
target_order = ordered_columns(previous_path, union_cols)

combined = pd.concat(combined_frames, ignore_index=True, sort=False)
combined = combined[target_order]

# Preserve license numbers as strings
combined["state_license_number"] = combined["state_license_number"].astype(str).str.strip()
combined["state"] = combined["state"].astype(str).str.upper()


# ---------------------------------------------------------------------------
# 2. Numeric conversions and profiling prep
# ---------------------------------------------------------------------------


numeric_cols = list({*REG_COLS, *SERVICE_COLS, *NUMERIC_OPTIONAL})

for col in numeric_cols:
    combined[col] = to_numeric(combined[col])

combined["is_closed"] = combined.get("is_closed", pd.Series([np.nan] * len(combined))).astype(str).str.lower().map({"true": True, "false": False})

# Replace empty strings post conversion
combined.replace({"": np.nan}, inplace=True)


# ---------------------------------------------------------------------------
# 3. Save combined dataset
# ---------------------------------------------------------------------------


ANALYSIS_DATA_DIR.mkdir(parents=True, exist_ok=True)
combined_output_path = ANALYSIS_DATA_DIR / COMBINED_FILENAME
combined.to_csv(combined_output_path, index=False)
print(f"Combined dataset written to {combined_output_path.relative_to(REPO_ROOT)}")


# ---------------------------------------------------------------------------
# 4. Profiling diagnostics
# ---------------------------------------------------------------------------


def coverage_table(df: pd.DataFrame) -> pd.DataFrame:
    tmp = df.replace({"": np.nan})
    coverage = 1.0 - tmp.isna().mean()
    return coverage.to_frame(name="coverage")


overall_coverage = coverage_table(combined)
overall_coverage.to_json(ANALYSIS_DATA_DIR / "profiling_metrics.json", orient="index", indent=2)

numeric_summary = combined[numeric_cols].describe().transpose()
numeric_summary.to_csv(ANALYSIS_DATA_DIR / "profiling_numeric.csv")

state_counts = combined.groupby("state")["state_license_number"].count().to_dict()

with open(ANALYSIS_DATA_DIR / "profiling_summary.md", "w", encoding="utf-8") as fh:
    fh.write(f"# SunsetWell Intake Snapshot — {RUN_DATE.date()}\n\n")
    fh.write("## Facility Counts by State\n")
    for state, count in state_counts.items():
        fh.write(f"- {state}: {count:,} facilities\n")
    fh.write("\n## Field Coverage (non-null ratios)\n")
    for col, row in overall_coverage["coverage"].items():
        fh.write(f"- {col}: {row:.3f}\n")

# Missingness plots
plot_missing = combined.replace({"": np.nan}).isna().mean().sort_values(ascending=False)

plt.figure(figsize=(10, 6))
sns.barplot(x=plot_missing.values, y=plot_missing.index, color="#1f77b4")
plt.xlabel("Share Missing")
plt.ylabel("Column")
plt.title("Overall Missingness by Column")
plt.tight_layout()
plt.savefig(ANALYSIS_DATA_DIR / "missing_overall.png", dpi=200)
plt.close()

plt.figure(figsize=(8, 4))
missing_by_state = combined.replace({"": np.nan}).isna().groupby(combined["state"]).mean().transpose()
missing_by_state.plot(kind="bar", figsize=(12, 6))
plt.ylabel("Share Missing")
plt.title("Missingness by State")
plt.legend(title="State")
plt.tight_layout()
plt.savefig(ANALYSIS_DATA_DIR / "missing_by_state.png", dpi=200)
plt.close()


# ---------------------------------------------------------------------------
# 5. Feature stats, z-scores, and UMAP embedding
# ---------------------------------------------------------------------------


feature_stats: Dict[str, Dict[str, float]] = {}
for col in REG_COLS + SERVICE_COLS + ["licensed_capacity"]:
    series = combined[col]
    feature_stats[col] = {
        "mean": safe_mean(series),
        "std": float(series.dropna().std()) if not series.dropna().empty else float("nan"),
    }
    std = feature_stats[col]["std"]
    if math.isclose(std, 0.0, abs_tol=1e-9) or math.isnan(std):
        combined[f"{col}_z"] = 0.0
    else:
        combined[f"{col}_z"] = ((series - feature_stats[col]["mean"]) / std).fillna(0.0)

# Persist stats for reference
with open(ANALYSIS_DATA_DIR / "umap_feature_stats.json", "w", encoding="utf-8") as fh:
    json.dump(feature_stats, fh, indent=2)

umap_feature_cols = [
    "state",
    "state_license_number",
    "facility_name",
] + REG_COLS + SERVICE_COLS + ["licensed_capacity"] + [f"{c}_z" for c in REG_COLS + SERVICE_COLS + ["licensed_capacity"]]

combined[umap_feature_cols].to_csv(ANALYSIS_DATA_DIR / "umap_features.csv", index=False)

# Missing mask for diagnostics
reg_missing = combined[REG_COLS].isna().all(axis=1)
service_missing = combined[SERVICE_COLS].isna().all(axis=1)
pd.DataFrame(
    {
        "state_license_number": combined["state_license_number"],
        "state": combined["state"],
        "reg_missing": reg_missing,
        "service_missing": service_missing,
    }
).to_csv(ANALYSIS_DATA_DIR / "umap_missing_mask.csv", index=False)

umap_input = combined[[f"{col}_z" for col in REG_COLS + SERVICE_COLS + ["licensed_capacity"]]].to_numpy()
umap_model = UMAP(n_neighbors=25, min_dist=0.3, metric="euclidean", random_state=42)
embedding = umap_model.fit_transform(umap_input)

embedding_df = pd.DataFrame(
    {
        "umap_x": embedding[:, 0],
        "umap_y": embedding[:, 1],
        "state": combined["state"],
        "state_license_number": combined["state_license_number"],
    }
)
embedding_df.to_csv(ANALYSIS_DATA_DIR / "umap_embedding.csv", index=False)

# Plots
plt.figure(figsize=(10, 7))
sns.scatterplot(
    data=embedding_df,
    x="umap_x",
    y="umap_y",
    hue="state",
    s=12,
    alpha=0.6,
)
plt.title("UMAP Embedding by State")
plt.tight_layout()
plt.savefig(ANALYSIS_DATA_DIR / "umap_state_scatter.png", dpi=250)
plt.close()

plt.figure(figsize=(10, 7))
scatter_df = embedding_df.copy()
scatter_df["complaint_count"] = combined["complaint_count"].fillna(0)
sns.scatterplot(
    data=scatter_df,
    x="umap_x",
    y="umap_y",
    hue="complaint_count",
    palette="viridis",
    s=12,
    alpha=0.65,
)
plt.title("Complaints Across UMAP Embedding")
plt.tight_layout()
plt.savefig(ANALYSIS_DATA_DIR / "umap_complaints.png", dpi=250)
plt.close()


# ---------------------------------------------------------------------------
# 6. Service imputations using k-NN over UMAP space
# ---------------------------------------------------------------------------


observed_mask = combined[SERVICE_COLS].notna().all(axis=1)

service_values = combined.loc[observed_mask, SERVICE_COLS].to_numpy()
umap_observed = embedding[observed_mask]

neigh_count = min(25, len(service_values)) if len(service_values) > 0 else 0
if neigh_count >= 1:
    nn_model = NearestNeighbors(n_neighbors=neigh_count, metric="euclidean")
    nn_model.fit(umap_observed)

imputed_records = []
service_array = combined[SERVICE_COLS].to_numpy(copy=True)
service_confidence = np.where(observed_mask, 1.0, 0.0)

for idx in range(len(combined)):
    if observed_mask.iloc[idx] or neigh_count < 1:
        imputed_records.append(service_array[idx])
        continue

    distances, indices = nn_model.kneighbors(embedding[idx : idx + 1], n_neighbors=neigh_count)
    distances = distances[0]
    neighbor_vals = service_values[indices[0]]

    weights = 1.0 / (distances + 1e-6)
    weights_sum = weights.sum()
    if weights_sum == 0:
        predicted = neighbor_vals.mean(axis=0)
    else:
        predicted = np.dot(weights, neighbor_vals) / weights_sum

    service_array[idx] = predicted
    service_confidence[idx] = service_confidence_from_dist(distances)
    imputed_records.append(predicted)

service_imputations = pd.DataFrame(
    np.vstack(imputed_records),
    columns=[f"{col}_imputed" for col in SERVICE_COLS],
)
service_imputations.insert(0, "state_license_number", combined["state_license_number"])
service_imputations["imputation_confidence"] = service_confidence
service_imputations.to_csv(ANALYSIS_DATA_DIR / "service_imputations.csv", index=False)

# Final service values (observed where available, else imputed)
final_service = combined[SERVICE_COLS].copy()
for col in SERVICE_COLS:
    imputed_col = f"{col}_imputed"
    final_service[col] = combined[col].fillna(service_imputations[imputed_col])


# ---------------------------------------------------------------------------
# 7. Score computation
# ---------------------------------------------------------------------------


reg_available = combined[REG_COLS].notna().any(axis=1)

reg_ranks = combined[REG_COLS].rank(pct=True)
reg_score = (1.0 - reg_ranks).mean(axis=1)
reg_score = reg_score.where(reg_available, 0.5)

service_ranks = final_service.rank(pct=True)
service_score = service_ranks.mean(axis=1).fillna(0.5)

capacity_percentile = percentile_scores(combined["licensed_capacity"])
capacity_score = capacity_percentile.fillna(0.5)

licensure_score = tenure_score(combined.get("license_issue_date"), combined.get("license_status").astype(str))

service_confidence_series = pd.Series(service_confidence, index=combined.index)

BASE_WEIGHTS = {
    "reg": 0.4,
    "service": 0.25,
    "capacity": 0.2,
    "licensure": 0.15,
}

effective_weights = pd.DataFrame(
    {
        "reg_weight": np.where(reg_available, BASE_WEIGHTS["reg"], 0.0),
        "service_weight": BASE_WEIGHTS["service"] * service_confidence_series,
        "capacity_weight": BASE_WEIGHTS["capacity"],
        "licensure_weight": BASE_WEIGHTS["licensure"],
    }
)

weight_sum = effective_weights.sum(axis=1)
weight_sum = weight_sum.replace(0, np.nan)

component_matrix = pd.DataFrame(
    {
        "reg_score": reg_score,
        "service_score": service_score,
        "capacity_score": capacity_score,
        "licensure_score": licensure_score,
    }
)

weighted_sum = (
    component_matrix["reg_score"] * effective_weights["reg_weight"]
    + component_matrix["service_score"] * effective_weights["service_weight"]
    + component_matrix["capacity_score"] * effective_weights["capacity_weight"]
    + component_matrix["licensure_score"] * effective_weights["licensure_weight"]
)

composite_raw = (weighted_sum / weight_sum).fillna(0.0)
sunsetwell_percentile = composite_raw.rank(pct=True)

scores_df = pd.DataFrame(
    {
        "state": combined["state"],
        "state_license_number": combined["state_license_number"],
        "facility_name": combined["facility_name"],
        "sunsetwell_percentile": sunsetwell_percentile,
        "composite_raw": composite_raw,
        "reg_score": component_matrix["reg_score"],
        "service_score": component_matrix["service_score"],
        "capacity_score": component_matrix["capacity_score"],
        "licensure_score": component_matrix["licensure_score"],
        **effective_weights.to_dict(orient="series"),
        "service_confidence": service_confidence_series,
        "reg_available": reg_available,
    }
)

scores_path = ANALYSIS_DATA_DIR / "alf_scores_v1.csv"
scores_df.to_csv(scores_path, index=False)

# Summary by state
summary = scores_df.groupby("state")["sunsetwell_percentile"].describe()
summary.to_csv(ANALYSIS_DATA_DIR / "alf_scores_summary.csv")

# Score extremes: top and bottom 150 per state
top_extremes = scores_df.sort_values("sunsetwell_percentile", ascending=False).groupby("state").head(150)
bottom_extremes = scores_df.sort_values("sunsetwell_percentile", ascending=True).groupby("state").head(150)
extremes = pd.concat([top_extremes, bottom_extremes], ignore_index=True)
extremes.to_csv(ANALYSIS_DATA_DIR / "score_extremes.csv", index=False)

# Prototype export (top 250 overall)
scores_df.sort_values("sunsetwell_percentile", ascending=False).head(250)[
    ["state", "state_license_number", "facility_name", "sunsetwell_percentile", "reg_score", "service_score"]
].to_csv(ANALYSIS_DATA_DIR / "prototype_scores.csv", index=False)


# ---------------------------------------------------------------------------
# 8. Diagnostics & sensitivity analysis
# ---------------------------------------------------------------------------


plt.figure(figsize=(6, 4))
sns.histplot(service_confidence_series, bins=30, color="#ff7f0e")
plt.xlabel("Service Confidence")
plt.ylabel("Facilities")
plt.title("Distribution of Service Confidence Scores")
plt.tight_layout()
plt.savefig(ANALYSIS_DATA_DIR / "service_confidence_hist.png", dpi=200)
plt.close()


# Generalization summary
generalization_summary = scores_df.groupby("state").agg(
    mean_pct=("sunsetwell_percentile", "mean"),
    var_pct=("sunsetwell_percentile", "var"),
    mean_conf=("service_confidence", "mean"),
)
generalization_summary.to_csv(ANALYSIS_DATA_DIR / "generalization_summary.csv")

generalization_report = [
    {
        "metric": "generalization_summary",
        "data": generalization_summary.to_dict(),
    }
]

tx_service_breakdown = combined.loc[combined["state"] == "TX", "provider_type"].value_counts().to_dict()
if tx_service_breakdown:
    generalization_report.append(
        {
            "metric": "tx_provider_mix",
            "data": tx_service_breakdown,
        }
    )

with open(ANALYSIS_DATA_DIR / "generalization_report.json", "w", encoding="utf-8") as fh:
    json.dump(generalization_report, fh, indent=2)


# Weight sensitivity grid
weight_grid = []
for reg_weight in [0.3, 0.35, 0.4, 0.45, 0.5]:
    for service_weight in [0.15, 0.25, 0.35]:
        cap_weight = 1.0 - (reg_weight + service_weight + BASE_WEIGHTS["licensure"])
        if cap_weight <= 0:
            continue

        alt_effective = effective_weights.copy()
        alt_effective["reg_weight"] = np.where(reg_available, reg_weight, 0.0)
        alt_effective["service_weight"] = service_weight * service_confidence_series
        alt_effective["capacity_weight"] = cap_weight
        alt_effective["licensure_weight"] = BASE_WEIGHTS["licensure"]

        alt_sum = alt_effective.sum(axis=1).replace(0, np.nan)
        alt_weighted = (
            component_matrix["reg_score"] * alt_effective["reg_weight"]
            + component_matrix["service_score"] * alt_effective["service_weight"]
            + component_matrix["capacity_score"] * alt_effective["capacity_weight"]
            + component_matrix["licensure_score"] * alt_effective["licensure_weight"]
        )
        alt_composite = (alt_weighted / alt_sum).fillna(0.0)
        delta = (alt_composite - composite_raw).abs()

        weight_grid.append(
            {
                "reg": reg_weight,
                "services": service_weight,
                "capacity": cap_weight,
                "licensure": BASE_WEIGHTS["licensure"],
                "avg_change": float(delta.mean()),
                "p95_change": float(delta.quantile(0.95)),
            }
        )

pd.DataFrame(weight_grid).to_csv(ANALYSIS_DATA_DIR / "weight_sensitivity.csv", index=False)

# Texas-specific diagnostics for continuity with prior reports
tx_mask = combined["state"] == "TX"
if tx_mask.any():
    tx_scores = scores_df.loc[tx_mask]
    tx_capacity = capacity_score.loc[tx_mask]

    tx_sample = pd.DataFrame(
        {
            "sunsetwell_percentile": tx_scores["sunsetwell_percentile"],
            "capacity_pct": tx_capacity,
        }
    )
    sample_n = min(500, len(tx_sample))
    tx_sample.sample(n=sample_n, random_state=42).to_csv(
        ANALYSIS_DATA_DIR / "tx_percentile_vs_capacity_sample.csv", index=False
    )

    provider_series = combined.loc[tx_mask, "facility_type_detail"].fillna(
        combined.loc[tx_mask, "provider_type"]
    )
    tx_provider_sample = pd.DataFrame(
        {
            "state_license_number": combined.loc[tx_mask, "state_license_number"],
            "facility_name": combined.loc[tx_mask, "facility_name"],
            "sunsetwell_percentile": tx_scores["sunsetwell_percentile"],
            "service_type": provider_series,
        }
    ).head(300)
    tx_provider_sample.to_csv(ANALYSIS_DATA_DIR / "tx_service_type_sample.csv", index=False)

    tx_scores[["reg_score", "service_score", "capacity_score"]].describe().to_csv(
        ANALYSIS_DATA_DIR / "tx_zscore_summary.csv"
    )

print("✅ Pipeline refresh complete.")
