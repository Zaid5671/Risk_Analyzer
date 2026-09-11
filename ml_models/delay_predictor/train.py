import logging
from pathlib import Path
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import LabelEncoder

from .config import (
    CANONICAL_WORKS_PATH,
    EXPENDITURE_FEATURES_PATH,
    MODELS_DIR,
    MODEL_JOB_PATH,
    ENCODERS_JOB_PATH,
    REFERENCE_DATE,
    FEATURE_COLS,
    RANDOM_STATE,
    N_ESTIMATORS,
    MAX_DEPTH,
    TEST_SIZE
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def train_delay_predictor():
    """
    Trains GradientBoostingClassifier on completed works to predict probability
    of exceeding 365-day completion deadline.
    """
    logging.info(f"Loading canonical works from {CANONICAL_WORKS_PATH}...")
    df_works = pd.read_parquet(CANONICAL_WORKS_PATH)
    
    if EXPENDITURE_FEATURES_PATH.exists():
        df_exp = pd.read_parquet(EXPENDITURE_FEATURES_PATH, columns=["work_id", "transaction_count"])
        df = df_works.merge(df_exp, on="work_id", how="left")
    else:
        df = df_works.copy()
        df["transaction_count"] = 0
        
    df["transaction_count"] = df["transaction_count"].fillna(0).astype(int)
    
    # Filter completed works for supervised ground-truth training
    comp = df[df["is_completed_flag"] == True].copy()
    logging.info(f"Training on {len(comp):,} completed works...")
    
    sanc_dt = pd.to_datetime(comp["sanction_date"], errors="coerce")
    comp_dt = pd.to_datetime(comp["completion_date"], errors="coerce")
    duration_days = (comp_dt - sanc_dt).dt.days
    
    # Target: 1 if sanction_to_completion_days > 365 else 0
    y = (duration_days > 365).astype(int).values
    
    ref_dt = pd.to_datetime(REFERENCE_DATE)
    comp["days_since_sanction"] = (ref_dt - sanc_dt).dt.days.fillna(0).astype(int)
    
    sanc_amt = pd.to_numeric(comp["sanction_amount"], errors="coerce").fillna(0.0).values
    disb_amt = pd.to_numeric(comp["amount_disbursed"], errors="coerce").fillna(0.0).values
    comp["utilization_ratio"] = np.where(sanc_amt > 0, np.clip(disb_amt / sanc_amt, 0.0, 1.0), 0.0)
    comp["has_first_disbursement"] = (disb_amt > 0).astype(int)
    
    # Encoders
    le_cat = LabelEncoder()
    comp["work_category_encoded"] = le_cat.fit_transform(comp["work_category"].fillna("UNKNOWN").astype(str))
    
    le_state = LabelEncoder()
    comp["state_encoded"] = le_state.fit_transform(comp["state"].fillna("UNKNOWN").astype(str))
    
    X = comp[FEATURE_COLS].values
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    
    logging.info(f"Fitting GradientBoostingClassifier (n_estimators={N_ESTIMATORS}, max_depth={MAX_DEPTH})...")
    clf = GradientBoostingClassifier(
        n_estimators=N_ESTIMATORS,
        max_depth=MAX_DEPTH,
        random_state=RANDOM_STATE
    )
    clf.fit(X_train, y_train)
    
    y_pred_proba = clf.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"Delay Predictor Test AUC-ROC: {auc:.4f}")
    logging.info(f"Model training complete. Test AUC-ROC = {auc:.4f}")
    
    # Save artifacts
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_JOB_PATH)
    encoders = {
        "category_encoder": le_cat,
        "state_encoder": le_state,
        "feature_cols": FEATURE_COLS
    }
    joblib.dump(encoders, ENCODERS_JOB_PATH)
    logging.info(f"Saved trained model to {MODEL_JOB_PATH} and encoders to {ENCODERS_JOB_PATH}")
    
    return clf, encoders, auc

if __name__ == "__main__":
    train_delay_predictor()
