# Implementation Plan: MPLADS Critical Review Fixes

Based on the [Critical Review](file:///C:/Users/zaid/.gemini/antigravity/brain/03fff92b-9948-4a01-9885-b5c27a0f9e18/critical_review.md), this plan addresses all identified issues in priority order.

> [!IMPORTANT]
> Phases 1–3 are **Critical** and must be done before submission/demo. Phases 4–5 are **Important**. Phase 6 is **Nice-to-Have**.

---

## Phase 1: Critical ML/Model Fixes (~4 hours)

### 1.1 Fix Model 1 — Remove Non-Cost Features from Isolation Forest

**Problem:** `rec_to_sanc_days` and `desc_word_count` are completely unrelated to cost. A work with a normal cost gets flagged as a "cost anomaly" because its approval was delayed or its description was verbose.

**Files to modify:**

#### [MODIFY] [config.py](file:///c:/Users/zaid/Desktop/CodeBlooded/ml_models/cost_anomaly/config.py)
- Remove `rec_to_sanc_days` and `desc_word_count` from the feature list
- Keep only: `sanction_amount_log`, `peer_iqr_deviation`, `cost_ratio_vs_peer_median`

#### [MODIFY] [work_features.py](file:///c:/Users/zaid/Desktop/CodeBlooded/feature_engineering/work_features.py) (lines 101-105)
- Change the `NATIONAL_ALL` fallback: instead of computing a national median across ALL work types, assign `INSUFFICIENT_PEER_DATA` label when neither fine nor coarse peer groups meet the minimum threshold
- Works with `INSUFFICIENT_PEER_DATA` should get a neutral score (0.25) and severity `INSUFFICIENT_PEER_DATA` instead of being compared against dissimilar works

```python
# BEFORE (line 101-105):
else:
    peer_level.append("NATIONAL_ALL")
    peer_count.append(len(df))
    peer_median.append(nat_median)
    peer_iqr.append(nat_iqr)

# AFTER:
else:
    peer_level.append("INSUFFICIENT_PEER_DATA")
    peer_count.append(0)
    peer_median.append(np.nan)
    peer_iqr.append(np.nan)
```

#### [MODIFY] [score.py](file:///c:/Users/zaid/Desktop/CodeBlooded/ml_models/cost_anomaly/score.py) (around line 41)
- In `score_works_dataset()`, add early handling for `INSUFFICIENT_PEER_DATA` works: assign default score 0.25, severity `INSUFFICIENT_PEER_DATA`, and skip Isolation Forest scoring for these rows

#### [MODIFY] [train.py](file:///c:/Users/zaid/Desktop/CodeBlooded/ml_models/cost_anomaly/train.py) (around line 19)
- Update `train_peer_isolation_forests()` to use only the 3 cost-related features
- The Isolation Forest will now only consider cost dimensions, making anomaly detection actually about cost

**Verification:**
- Re-run Model 1 pipeline end-to-end
- Verify that works previously flagged solely due to high `rec_to_sanc_days` or `desc_word_count` are now correctly scored LOW
- Verify `INSUFFICIENT_PEER_DATA` works (~110) are no longer compared against national median of all types
- Update existing tests in `tests/test_model1_cost_anomaly.py` to reflect the reduced feature set

---

### 1.2 Fix Model 3 — Velocity Calculation Bug

**Problem:** When `window_days = 0` (single transaction), velocity becomes the entire disbursed amount, causing false HIGH anomalies.

#### [MODIFY] [expenditure_features.py](file:///c:/Users/zaid/Desktop/CodeBlooded/feature_engineering/expenditure_features.py) (lines 53-57)

```python
# BEFORE (line 53-57):
exp_agg["spending_velocity_per_day"] = np.where(
    window_days > 0,
    tot_amt / np.maximum(1, window_days),
    tot_amt
)

# AFTER — use 30-day minimum window to prevent single-transaction inflation:
exp_agg["spending_velocity_per_day"] = np.where(
    window_days > 0,
    tot_amt / np.maximum(30, window_days),
    0.0  # Single transaction: no meaningful velocity, set to 0
)
```

**Verification:**
- Re-run Model 3 feature engineering
- Check that single-transaction works no longer have absurdly high velocity values
- Verify overall HIGH severity count stays reasonable (~1,737 ± 10%)
- Update `tests/test_model3_fund_expenditure.py` if any assertions on velocity values exist

---

### 1.3 Fix Delay Rule Engine — Stop Masking Negative Delays

**Problem:** Works where `sanction_date < recommendation_date` (negative delay) are silently mapped to 0 days, hiding potential fraud/data corruption.

#### [MODIFY] [rules.py](file:///c:/Users/zaid/Desktop/CodeBlooded/rule_engines/delay/rules.py) (lines 20-22)

```python
# BEFORE (lines 20-22):
is_negative = (days < 0)
days_clean = np.where(is_negative, 0, days)

# AFTER — flag negative delays as data quality exceptions:
is_negative = (days < 0)
days_clean = np.where(is_negative, np.nan, days)  # Preserve NaN to mark as exception
```

Then in the scoring/severity assignment section of the same file, add handling for negative delay works:

```python
# Add a new category for negative delays:
# Where is_negative is True → severity = "DATA_QUALITY_EXCEPTION", score = 0.90
# explanation = "Sanction date precedes recommendation date by X days — 
#                possible data entry error or backdated sanction requiring audit"
```

#### [MODIFY] [score.py or equivalent output builder in the delay module]
- Ensure the output parquet and database ingestion include `DATA_QUALITY_EXCEPTION` as a valid severity for delay results
- Add `DATA_QUALITY_EXCEPTION` to the `delay_severities` list in [health.py L45](file:///c:/Users/zaid/Desktop/CodeBlooded/api/routers/health.py#L45)

**Verification:**
- Re-run delay rule engine
- Verify works with negative `rec_to_sanc_days` now show `DATA_QUALITY_EXCEPTION` severity instead of `NONE`
- Count how many works have negative delays (likely a small but important set)
- Update `tests/test_delay_rules.py` to add a test case for negative delays

---

### 1.4 Fix Model 2 — Date Proximity Decay and Location Logic

**Problem 1:** `exp(-days_diff / 30)` decays too aggressively. At 90 days (the blocking window limit), date_proximity ≈ 0.05, effectively nullifying the date signal for cross-quarter duplicates.

**Problem 2:** Different-constituency works cannot be physical duplicates but are only penalized by losing a small +0.15 bonus instead of being filtered out.

#### [MODIFY] [structural.py](file:///c:/Users/zaid/Desktop/CodeBlooded/ml_models/duplicate_work/structural.py) (lines 43-44)

```python
# BEFORE (line 43-44):
days_diff = df["days_diff"].values
df["date_proximity"] = np.exp(-days_diff / DATE_PROXIMITY_DECAY_DAYS)

# AFTER — gentler decay:
days_diff = df["days_diff"].values
df["date_proximity"] = np.exp(-days_diff / 60.0)  # Was 30.0, now 60.0
```

#### [MODIFY] [structural.py](file:///c:/Users/zaid/Desktop/CodeBlooded/ml_models/duplicate_work/structural.py) or the scoring pipeline
Add a confidence penalty for different-constituency pairs rather than just losing a bonus:

```python
# After computing the final duplicate_score, apply a confidence penalty:
# If both works are in DIFFERENT constituencies AND different MPs,
# reduce the score by 20% — these cannot be physical duplicates
different_location = (~df["is_same_constituency"]) & (~df["is_same_mp"])
df.loc[different_location, "duplicate_score"] *= 0.80
```

**Verification:**
- Re-run Model 2 pipeline
- Verify that cross-quarter duplicate pairs (60-90 day gaps) now have higher scores than before
- Verify that different-constituency pairs get penalized
- Update `tests/test_model2_duplicate_work.py` with new decay constant

---

## Phase 2: Add Predictive Component (~4 hours)

> [!CAUTION]
> The PS **explicitly** requires "predictive insights." This is a complete gap that evaluators will catch. Even a simple forecasting model dramatically strengthens the submission.

### 2.1 Add a Delay Prediction Model (Model 5)

**Approach:** A lightweight **regression model** that predicts, for each incomplete/open work, the **probability of exceeding the 365-day completion deadline** based on current progress signals.

#### [NEW] `ml_models/delay_predictor/config.py`
- Define feature set: `days_since_sanction`, `utilization_ratio`, `transaction_count`, `work_category_encoded`, `state_encoded`, `has_first_disbursement`
- Define output: `predicted_completion_risk` ∈ [0.0, 1.0]

#### [NEW] `ml_models/delay_predictor/train.py`
- **Training data:** Use the 44,417 *completed* works as labeled examples (target = 1 if `sanction_to_completion_days > 365`, else 0)
- **Model:** `sklearn.ensemble.GradientBoostingClassifier` or `sklearn.linear_model.LogisticRegression`
- Train on completed works, predict on the 54,408 *open/incomplete* works
- This is a supervised model — genuinely predictive, not just retrospective

#### [NEW] `ml_models/delay_predictor/predict.py`
- Load trained model
- Score all open works
- Output columns: `work_id`, `predicted_completion_risk`, `predicted_risk_severity` (HIGH/MEDIUM/LOW), `explanation`
- Save to `data/model_outputs/delay_predictor/delay_predictions.parquet`

#### [NEW] `database/models.py` — add `DelayPredictionResult` ORM model
```python
class DelayPredictionResult(Base):
    __tablename__ = "delay_prediction_results"
    work_id = Column(String(64), ForeignKey("works.work_id", ondelete="CASCADE"), primary_key=True)
    predicted_completion_risk = Column(Float, nullable=False)
    predicted_risk_severity = Column(String(32), nullable=False)
    days_since_sanction = Column(Integer, nullable=True)
    current_utilization = Column(Float, nullable=True)
    explanation = Column(Text, nullable=True)
```

#### [MODIFY] [database/ingest.py](file:///c:/Users/zaid/Desktop/CodeBlooded/database/ingest.py)
- Add ingestion function for the new `delay_prediction_results` table using the existing upsert pattern

#### [NEW] `api/routers/predictions.py`
- `GET /api/v1/analytics/predictions/delay-risk` — paginated list of open works ranked by predicted completion risk
- `GET /api/v1/analytics/predictions/delay-risk/{work_id:path}` — single work prediction detail
- Apply standard RBAC scoping via `apply_work_joined_scope`

#### [NEW] `api/schemas/prediction.py`
- Pydantic schemas: `DelayPredictionItem`, `DelayPredictionDetail`

#### [MODIFY] [api/routers/__init__.py](file:///c:/Users/zaid/Desktop/CodeBlooded/api/routers/__init__.py)
- Import and register `prediction_router`

#### [MODIFY] [api/main.py](file:///c:/Users/zaid/Desktop/CodeBlooded/api/main.py)
- `app.include_router(prediction_router, prefix=settings.API_V1_STR)`

#### [MODIFY] [works.py router](file:///c:/Users/zaid/Desktop/CodeBlooded/api/routers/works.py) — Work Detail dossier
- Add `delay_prediction` field to `IndependentModelProfiles` so the work detail page shows prediction alongside the 4 existing modules

#### [NEW] Frontend integration
- Add a "Predicted Delay Risk" card to the Work Detail page
- Add a "Predictive Insights" page showing top-risk open works

**Verification:**
- Train model on completed works, verify AUC-ROC > 0.70 on held-out test set
- Verify predictions only exist for open/incomplete works (not completed ones)
- Add `tests/test_model5_delay_predictor.py` with basic assertions
- Verify API endpoints return correct data with RBAC scoping

---

## Phase 3: Fix SLA Cliff Early Warning Logic (~1 hour)

**Problem:** The SLA cliff alert checks `rec_to_sanc` days for **already-sanctioned** works. These works have already passed the SLA — warning about them is meaningless. A real early warning should target works that are **recommended but not yet sanctioned** and approaching the 75-day limit.

**However:** The canonical dataset only contains works that already have a `sanction_date`. There are no pending/unsanctioned works in the data.

**Solution:** Repurpose the SLA cliff alert as a **retrospective near-miss analysis** — works that *barely* made the SLA deadline (sanctioned between day 45-74) — and rename it to communicate this accurately. This is still useful for identifying districts/authorities that consistently cut it close.

#### [MODIFY] [early_warning.py](file:///c:/Users/zaid/Desktop/CodeBlooded/analytics/trends/early_warning.py) (lines 19-60)

```python
# Rename function:
def generate_sla_near_miss_alerts(...)

# Update warning_type:
"warning_type": "SLA_NEAR_MISS"

# Update action_recommended:
"action_recommended": f"District Authority sanctioned this work at day {elapsed} of 75-day SLA. 
    Pattern indicates systemic near-deadline processing — recommend capacity review."
```

Also add a **new forward-looking alert** for works approaching dormancy:

#### [MODIFY] [early_warning.py](file:///c:/Users/zaid/Desktop/CodeBlooded/analytics/trends/early_warning.py)
Add a new function `generate_approaching_dormancy_alerts()`:
- Target: Works with `sanction_date` 270-364 days ago AND `amount_disbursed == 0` AND `work_status` not completed
- Warning type: `APPROACHING_DORMANCY`
- This IS genuinely predictive/forward-looking — these works are about to become dormant

#### [MODIFY] [schemas.py](file:///c:/Users/zaid/Desktop/CodeBlooded/analytics/trends/schemas.py)
- Update `EarlyWarningItem` if `warning_type` values are enumerated

**Verification:**
- Re-run early warning pipeline
- Verify `SLA_NEAR_MISS` alerts are generated for works sanctioned on days 45-74
- Verify `APPROACHING_DORMANCY` alerts target the correct age window
- Update `tests/test_early_warnings.py`

---

## Phase 4: Security & Config Hardening (~1 hour)

### 4.1 Remove CORS Wildcard

#### [MODIFY] [config.py](file:///c:/Users/zaid/Desktop/CodeBlooded/api/config.py) (lines 18-24)

```python
# BEFORE:
CORS_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*",
]

# AFTER — remove wildcard, add Vercel/Netlify if deployed:
CORS_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
```

### 4.2 Make JWT Secret Failure Loud

#### [MODIFY] [config.py](file:///c:/Users/zaid/Desktop/CodeBlooded/api/config.py) (lines 27-29)

```python
# BEFORE:
JWT_SECRET_KEY: str = os.getenv(
    "JWT_SECRET_KEY",
    "mplads-dev-secret-key-change-in-production-32-bytes-minimum"
)

# AFTER — fail loudly if not set:
JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")

def __init__(self):
    if not self.JWT_SECRET_KEY:
        raise RuntimeError(
            "FATAL: JWT_SECRET_KEY environment variable is not set. "
            "Set it in .env before starting the server."
        )
```

> [!WARNING]
> After this change, ensure `.env` has `JWT_SECRET_KEY` set, or the server won't start. This is intentional — silent fallback to a hardcoded secret is a security hole.

### 4.3 Delete Dead Audit Script

#### [DELETE] [audit.py](file:///c:/Users/zaid/Desktop/CodeBlooded/audit.py)
- Uses SQLite (`data/database.sqlite`) in a PostgreSQL project — will crash if run
- Remove from repository

**Verification:**
- Start the API server, verify it boots with `.env` containing `JWT_SECRET_KEY`
- Verify CORS headers no longer include `*`
- Verify `audit.py` is removed

---

## Phase 5: Cleanup & Documentation (~2 hours)

### 5.1 Fix `summaries.py` Import Inside Request Handler

#### [MODIFY] [summaries.py](file:///c:/Users/zaid/Desktop/CodeBlooded/api/routers/summaries.py) (lines 63-74)
- Move the `import pandas` and `from pathlib import Path` to the top of the file
- Cache the Parquet read at module level (like `trends.py` does) instead of reading on every request

### 5.2 Fix Hardcoded 98825 in Trends Response

#### [MODIFY] [trends.py](file:///c:/Users/zaid/Desktop/CodeBlooded/api/routers/trends.py) (line 110)

```python
# BEFORE:
"total_canonical_works": 98825,

# AFTER — compute from data:
"total_canonical_works": int(nat_df["total_sanctioned_works"].sum()),
```

### 5.3 Update README

#### [MODIFY] [README.md](file:///c:/Users/zaid/Desktop/CodeBlooded/README.md)
- Update Phase 7 row from `NEXT` to `COMPLETE` (frontend exists and is substantial)
- Add Phase 8 row for the new Predictive Delay Risk model
- Update test count (will increase with new tests)
- Add Model 5 (Delay Predictor) to the architecture diagram and model descriptions
- Update the "Current Platform Capabilities" section to mention predictive insights
- Remove or update the demo password if it changes

### 5.4 Add `DATA_QUALITY_EXCEPTION` to Delay Filter Options

#### [MODIFY] [health.py](file:///c:/Users/zaid/Desktop/CodeBlooded/api/routers/health.py) (line 45)

```python
# BEFORE:
delay_severities=["HIGH", "MEDIUM", "LOW", "NONE"],

# AFTER:
delay_severities=["HIGH", "MEDIUM", "LOW", "NONE", "DATA_QUALITY_EXCEPTION"],
```

**Verification:**
- Run full test suite: `python -m pytest tests/ -v`
- Verify all existing tests still pass
- Verify new tests for Model 5 and modified models pass

---

## Phase 6: Nice-to-Have (~4 hours, post-submission)

### 6.1 Add CSV Export Endpoint

#### [NEW] `api/routers/export.py`
- `GET /api/v1/export/cost-anomalies?severity=HIGH` → returns CSV file download
- `GET /api/v1/export/delays?severity=HIGH` → returns CSV file download
- Uses `StreamingResponse` with `text/csv` content type
- RBAC scoped — users only export data within their jurisdiction

### 6.2 Add Rate Limiting to Analytics Endpoints

#### [MODIFY] All analytics routers
- Add `@limiter.limit("120/minute")` decorators to list endpoints
- The README claims this exists but it doesn't

### 6.3 Add Audit Logging Middleware

#### [NEW] `api/middleware/audit_log.py`
- Log every authenticated API request: `user_id`, `role`, `endpoint`, `query_params`, `timestamp`, `response_status`
- Store in a new `audit_logs` table or write to a log file

### 6.4 Connection Pool Sharing

#### [MODIFY] [connection.py](file:///c:/Users/zaid/Desktop/CodeBlooded/database/connection.py)
- Make `check_connection()` reuse the global `_engine` instead of creating a new one each call

---

## Re-Run & Re-Ingest Sequence

After completing Phases 1-3, the following must be re-executed in order:

```bash
# Step 1: Re-run feature engineering (updated work_features, expenditure_features)
python -m feature_engineering.canonical
python -m feature_engineering.work_features
python -m feature_engineering.expenditure_features

# Step 2: Re-run all modified models
python -m ml_models.cost_anomaly.train
python -m ml_models.cost_anomaly.score
python -m ml_models.duplicate_work.score      # for updated structural scoring
python -m ml_models.fund_expenditure_anomaly.train
python -m ml_models.fund_expenditure_anomaly.score
python -m rule_engines.delay.run

# Step 3: Train and run new predictive model
python -m ml_models.delay_predictor.train
python -m ml_models.delay_predictor.predict

# Step 4: Re-run early warnings
python -m analytics.trends.pipeline

# Step 5: Re-ingest everything into Supabase
python -m database.ingest

# Step 6: Run full test suite
python -m pytest tests/ -v
```

> [!NOTE]
> The database ingestion uses **upsert** for works and model result tables, so re-ingestion is safe and idempotent. Duplicate pairs and expenditures are truncated and re-loaded.

---

## Verification Plan

### Automated Tests
```bash
# Run full suite after all changes:
python -m pytest tests/ -v

# Expected: all existing tests pass (some may need minor updates for changed features/severities)
# New tests added for:
#   - test_model5_delay_predictor.py (6 tests)
#   - Updated test_model1 (reduced features)
#   - Updated test_delay_rules (negative delay handling)
#   - Updated test_model2 (new decay constant)
```

### Manual Verification
- **Model 1:** Verify that a work with normal cost but high `rec_to_sanc_days` no longer shows HIGH cost anomaly
- **Model 3:** Verify single-transaction works no longer have inflated velocity
- **Delay:** Verify works with negative `rec_to_sanc_days` show `DATA_QUALITY_EXCEPTION`
- **Model 5:** Verify predictions only exist for open works, and AUC > 0.70
- **API:** Hit all endpoints via Postman, verify 4 stakeholder scoping still works
- **Frontend:** Verify new prediction cards appear in work detail pages

---

## Summary

| Phase | Priority | Estimated Time | Key Outcome |
|---|---|---|---|
| **Phase 1** | 🔴 Critical | ~4 hours | ML models produce correct, defensible results |
| **Phase 2** | 🔴 Critical | ~4 hours | PS "predictive insights" requirement satisfied |
| **Phase 3** | 🔴 Critical | ~1 hour | Early warnings are forward-looking, not retrospective |
| **Phase 4** | 🟡 Important | ~1 hour | Security misconfigurations fixed |
| **Phase 5** | 🟡 Important | ~2 hours | Code cleanup, docs updated, test suite expanded |
| **Phase 6** | 🟢 Nice-to-have | ~4 hours | Export, logging, rate limiting |
| **Total** | | **~12-16 hours** | Score improvement: **7.0 → 8.5+/10** |
