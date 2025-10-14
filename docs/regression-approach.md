# ARCHIVED: Regression Analysis for SunsetWell Score Weights

This document captures exploratory analyses used to inform earlier versions of the score. The current scoring system uses an absolute 0–100 composite with peer percentiles and versioned, empirically derived weights aligned to adverse outcome benchmarks. Exact formulas and parameters are proprietary and not disclosed.

## Objective
Derive empirical weights for scoring components by analyzing which metrics best predict facility quality outcomes.

## Methodology

### 1. Data Preparation

```sql
-- Extract facility data with all predictors and outcomes
SELECT
    facility_id,
    provider_type,
    state,

    -- OUTCOME VARIABLE (dependent variable)
    overall_rating,

    -- PREDICTOR: Health/Safety Metrics
    health_inspection_rating,
    total_weighted_health_survey_score,
    number_of_substantiated_complaints,
    number_of_fines,
    total_amount_of_fines,
    number_of_facility_reported_incidents,

    -- PREDICTOR: Staffing Metrics
    staffing_rating,
    rn_staffing_hours_per_resident_per_day,
    total_nurse_staffing_hours_per_resident_per_day,
    reported_nurse_aide_staffing_hours_per_resident_per_day,

    -- PREDICTOR: Quality Measures
    quality_measures_rating,

    -- CONTROL VARIABLES (facility characteristics)
    total_beds,
    for_profit,

FROM resources
WHERE provider_type = 'nursing_home'
    AND overall_rating IS NOT NULL
    AND health_inspection_rating IS NOT NULL
    AND staffing_rating IS NOT NULL
    AND quality_measures_rating IS NOT NULL;
```

### 2. Create Component Groups

Group metrics into logical components:

```typescript
const components = {
  safety: [
    'health_inspection_rating',
    'total_weighted_health_survey_score',
    'number_of_substantiated_complaints',
    'number_of_fines'
  ],

  staffing: [
    'staffing_rating',
    'rn_staffing_hours_per_resident_per_day',
    'total_nurse_staffing_hours_per_resident_per_day'
  ],

  quality: [
    'quality_measures_rating'
  ]
}
```

### 3. Regression Models

#### Model 1: Individual Predictors (Feature Importance)

```python
# Using sklearn/statsmodels
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

# Standardize all predictors (z-scores)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Fit model
model = LinearRegression()
model.fit(X_scaled, y)

# Extract coefficients (these are the weights!)
weights = dict(zip(predictor_names, model.coef_))
```

**Interpretation:** Standardized coefficients show relative importance when all predictors are on same scale.

#### Model 2: Component-Level Regression

```python
# Create component scores first (average within each group)
df['safety_score'] = df[safety_metrics].mean(axis=1)
df['staffing_score'] = df[staffing_metrics].mean(axis=1)
df['quality_score'] = df[quality_metrics].mean(axis=1)

# Regress on component scores
X_components = df[['safety_score', 'staffing_score', 'quality_score']]
model_components = LinearRegression()
model_components.fit(X_components, y)

# These coefficients are your component weights!
component_weights = {
    'safety': model_components.coef_[0],
    'staffing': model_components.coef_[1],
    'quality': model_components.coef_[2]
}

# Normalize to sum to 1.0
total = sum(component_weights.values())
normalized_weights = {k: v/total for k, v in component_weights.values()}
```

#### Model 3: Validation with Hold-Out Set

```python
from sklearn.model_selection import train_test_split

# Split data 80/20
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Fit on training
model.fit(X_train, y_train)

# Evaluate on test
r2_score = model.score(X_test, y_test)
print(f"R² on test set: {r2_score}")
```

### 4. Alternative: Random Forest for Non-Linear Relationships

```python
from sklearn.ensemble import RandomForestRegressor

# Random forest can capture non-linear relationships
rf = RandomForestRegressor(n_estimators=100, random_state=42)
rf.fit(X, y)

# Feature importances (Gini importance)
importances = dict(zip(predictor_names, rf.feature_importances_))

# These can also serve as weights
```

### 5. Interpretation Guidelines

**Standardized Coefficients:**
- Positive coefficient = higher value improves outcome
- Negative coefficient = higher value worsens outcome (flip for scoring)
- Magnitude = relative importance

**Example Output:**
```
health_inspection_rating:     0.45  (45% importance)
staffing_rating:              0.30  (30% importance)
quality_measures_rating:      0.25  (25% importance)
```

**These become your weights!**

### 6. Diagnostics to Check

```python
# 1. Check for multicollinearity (VIF)
from statsmodels.stats.outliers_influence import variance_inflation_factor

vif_data = pd.DataFrame()
vif_data["feature"] = X.columns
vif_data["VIF"] = [variance_inflation_factor(X.values, i) for i in range(len(X.columns))]

# VIF > 10 indicates high multicollinearity (drop redundant variables)

# 2. Check residual distribution
residuals = y - model.predict(X)
plt.hist(residuals, bins=50)

# Should be roughly normal

# 3. Check for influential outliers
from statsmodels.stats.outliers_influence import OLSInfluence
influence = OLSInfluence(model)
cooks_d = influence.cooks_distance[0]

# Flag facilities with Cook's D > 4/n
```

## Recommended Implementation Steps

1. **Extract data** from Supabase into CSV/DataFrame
2. **Clean data:**
   - Handle missing values (impute or drop)
   - Remove outliers (> 3 SD from mean)
   - Check for data quality issues
3. **Standardize predictors** (z-scores)
4. **Fit component-level regression**
5. **Extract and normalize weights**
6. **Validate with hold-out set**
7. **Document methodology** for transparency

## Expected Output

```typescript
// Final weights for SunsetWell Score
export const SUNSETWELL_WEIGHTS = {
  nursing_home: {
    safety: 0.42,      // Health inspections, deficiencies
    staffing: 0.28,    // RN/total staffing levels
    quality: 0.30      // Quality measures, outcomes
  },

  home_health: {
    outcomes: 0.45,    // Patient improvement rates
    safety: 0.35,      // Adverse events
    patient_experience: 0.20
  },

  // ... other facility types
}
```

## Validation Metrics

Report these for transparency:

- **R² (R-squared):** Variance explained by model (target: > 0.6)
- **Adjusted R²:** Penalizes for number of predictors
- **RMSE:** Root mean squared error (lower is better)
- **Cross-validation score:** 5-fold CV to ensure generalization

## Sensitivity Analysis

Test weight robustness:

```python
# Bootstrap confidence intervals
from sklearn.utils import resample

bootstrap_weights = []
for i in range(1000):
    X_boot, y_boot = resample(X, y)
    model.fit(X_boot, y_boot)
    bootstrap_weights.append(model.coef_)

# Calculate 95% CI for each weight
weights_ci = np.percentile(bootstrap_weights, [2.5, 97.5], axis=0)
```

If confidence intervals are wide, weights are unstable (collect more data or simplify model).

---

**Next Steps:**
1. Create `scripts/analyze-weights.ts` or `.py`
2. Run regression on nursing home data first
3. Document results in `docs/scoring-model.md`
4. Repeat for other facility types
5. Implement weights in score calculation
