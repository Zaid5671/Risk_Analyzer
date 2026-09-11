import logging
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

from .config import (
    CANONICAL_WORKS_PATH,
    EXPENDITURE_FEATURES_PATH,
    MODEL_OUTPUTS_DIR,
    OUTPUT_PARQUET_PATH,
    MODEL_JOB_PATH,
    ENCODERS_JOB_PATH,
    REFERENCE_DATE,
    FEATURE_COLS,
    SEVERITY_HIGH_THRESHOLD,
    SEVERITY_MEDIUM_THRESHOLD
)
from .train import train_delay_predictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def _safe_transform(encoder, series, default_val=0):
    """Safely transforms categorical series using fitted LabelEncoder, handling unseen labels."""
    mapping = {label: idx for idx, label in enumerate(encoder.classes_)}
    return series.map(lambda x: mapping.get(x, default_val)).values

def predict_delay_risk(save_output: bool = True) -> pd.DataFrame:
    """
    Loads trained GradientBoosting model and scores all open/incomplete works
    (is_completed_flag == False) for risk of exceeding 365-day completion deadline.
    """
    if not MODEL_JOB_PATH.exists() or not ENCODERS_JOB_PATH.exists():
        logging.info("Model artifacts not found. Initiating training...")
        clf, encoders, _ = train_delay_predictor()
    else:
        clf = joblib.load(MODEL_JOB_PATH)
        encoders = joblib.load(ENCODERS_JOB_PATH)

    le_cat = encoders["category_encoder"]
    le_state = encoders["state_encoder"]

    logging.info(f"Loading canonical works from {CANONICAL_WORKS_PATH}...")
    df_works = pd.read_parquet(CANONICAL_WORKS_PATH)

    if EXPENDITURE_FEATURES_PATH.exists():
        df_exp = pd.read_parquet(EXPENDITURE_FEATURES_PATH, columns=["work_id", "transaction_count"])
        df = df_works.merge(df_exp, on="work_id", how="left")
    else:
        df = df_works.copy()
        df["transaction_count"] = 0

    df["transaction_count"] = df["transaction_count"].fillna(0).astype(int)

    # Filter to ONLY open / incomplete works
    df_open = df[df["is_completed_flag"] == False].copy()
    logging.info(f"Scoring {len(df_open):,} open/incomplete works for predictive delay risk...")

    ref_dt = pd.to_datetime(REFERENCE_DATE)
    sanc_dt = pd.to_datetime(df_open["sanction_date"], errors="coerce")
    days_since = (ref_dt - sanc_dt).dt.days.fillna(0).astype(int)
    df_open["days_since_sanction"] = days_since

    sanc_amt = pd.to_numeric(df_open["sanction_amount"], errors="coerce").fillna(0.0).values
    disb_amt = pd.to_numeric(df_open["amount_disbursed"], errors="coerce").fillna(0.0).values
    util = np.where(sanc_amt > 0, np.clip(disb_amt / sanc_amt, 0.0, 1.0), 0.0)
    df_open["utilization_ratio"] = util
    df_open["current_utilization"] = np.round(util, 4)
    df_open["has_first_disbursement"] = (disb_amt > 0).astype(int)

    cat_series = df_open["work_category"].fillna("UNKNOWN").astype(str)
    state_series = df_open["state"].fillna("UNKNOWN").astype(str)
    df_open["work_category_encoded"] = _safe_transform(le_cat, cat_series)
    df_open["state_encoded"] = _safe_transform(le_state, state_series)

    X = df_open[FEATURE_COLS].values

    # Predict risk probabilities
    risk_probs = clf.predict_proba(X)[:, 1]
    df_open["predicted_completion_risk"] = np.round(np.clip(risk_probs, 0.0, 1.0), 4)

    # Categorize severity
    severities = []
    for r in df_open["predicted_completion_risk"].values:
        if r >= SEVERITY_HIGH_THRESHOLD:
            severities.append("HIGH")
        elif r >= SEVERITY_MEDIUM_THRESHOLD:
            severities.append("MEDIUM")
        else:
            severities.append("LOW")
    df_open["predicted_risk_severity"] = severities

    # Generate transparent explanation
    explanations = []
    for r, sev, days, u, tx in zip(
        df_open["predicted_completion_risk"].values,
        df_open["predicted_risk_severity"].values,
        df_open["days_since_sanction"].values,
        df_open["current_utilization"].values,
        df_open["transaction_count"].values
    ):
        expl = (
            f"Predicted Completion Risk: {r:.2f} ({sev}). "
            f"Work has elapsed {days} days since sanction with {u*100:.1f}% fund utilization "
            f"across {tx} disbursement transaction(s)."
        )
        explanations.append(expl)
    df_open["explanation"] = explanations

    output_cols = [
        "work_id",
        "predicted_completion_risk",
        "predicted_risk_severity",
        "days_since_sanction",
        "current_utilization",
        "explanation"
    ]
    out_df = df_open[output_cols].copy()

    if save_output:
        MODEL_OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
        out_df.to_parquet(OUTPUT_PARQUET_PATH, index=False)
        logging.info(f"Saved {len(out_df):,} delay predictions to {OUTPUT_PARQUET_PATH}")

    sev_dist = out_df["predicted_risk_severity"].value_counts().to_dict()
    logging.info(f"Prediction complete. Severity distribution: {sev_dist}")
    return out_df

if __name__ == "__main__":
    predict_delay_risk()
