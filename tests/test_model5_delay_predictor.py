"""
Unit and Integration Tests for Model 5: Predictive Delay Risk Model
AI-Powered MPLADS Monitoring and Analytics Platform
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import joblib

from ml_models.delay_predictor.config import (
    FEATURE_COLS,
    OUTPUT_PARQUET_PATH,
    MODEL_JOB_PATH,
    ENCODERS_JOB_PATH,
    CANONICAL_WORKS_PATH,
    SEVERITY_HIGH_THRESHOLD,
    SEVERITY_MEDIUM_THRESHOLD
)
from database.connection import get_session
from database.models import Work, DelayPredictionResult


def test_delay_predictor_score_bounds():
    """Test 1: Predicted completion risk is strictly bounded within [0.0, 1.0]."""
    assert OUTPUT_PARQUET_PATH.exists(), f"Output parquet {OUTPUT_PARQUET_PATH} does not exist"
    df = pd.read_parquet(OUTPUT_PARQUET_PATH)
    scores = df["predicted_completion_risk"]
    assert not scores.isna().any(), "Found NaN in predicted_completion_risk"
    assert (scores >= 0.0).all(), "Found score < 0.0"
    assert (scores <= 1.0).all(), "Found score > 1.0"


def test_delay_predictor_severity_mapping():
    """Test 2: Severity tiers strictly follow HIGH >= 0.75, MEDIUM >= 0.50, LOW < 0.50."""
    df = pd.read_parquet(OUTPUT_PARQUET_PATH)
    
    high_works = df[df["predicted_completion_risk"] >= SEVERITY_HIGH_THRESHOLD]
    if not high_works.empty:
        assert (high_works["predicted_risk_severity"] == "HIGH").all()
        
    medium_works = df[
        (df["predicted_completion_risk"] >= SEVERITY_MEDIUM_THRESHOLD) &
        (df["predicted_completion_risk"] < SEVERITY_HIGH_THRESHOLD)
    ]
    if not medium_works.empty:
        assert (medium_works["predicted_risk_severity"] == "MEDIUM").all()
        
    low_works = df[df["predicted_completion_risk"] < SEVERITY_MEDIUM_THRESHOLD]
    if not low_works.empty:
        assert (low_works["predicted_risk_severity"] == "LOW").all()


def test_only_open_works_predicted():
    """Test 3: Delay prediction is strictly computed for open/incomplete works only."""
    df_pred = pd.read_parquet(OUTPUT_PARQUET_PATH)
    df_works = pd.read_parquet(CANONICAL_WORKS_PATH, columns=["work_id", "is_completed_flag"])
    
    # 54,408 open works
    open_works = df_works[df_works["is_completed_flag"] == False]
    assert len(df_pred) == len(open_works), f"Expected {len(open_works)} predictions, got {len(df_pred)}"
    
    # Verify no completed work is in predictions
    merged = df_pred.merge(df_works, on="work_id", how="left")
    assert (~merged["is_completed_flag"]).all(), "Found completed works in delay predictions output!"


def test_feature_completeness_and_model_artifacts():
    """Test 4: Features used match specification and model artifacts exist."""
    expected_features = [
        "days_since_sanction",
        "utilization_ratio",
        "transaction_count",
        "work_category_encoded",
        "state_encoded",
        "has_first_disbursement",
    ]
    assert FEATURE_COLS == expected_features
    assert MODEL_JOB_PATH.exists(), f"Model file {MODEL_JOB_PATH} missing"
    assert ENCODERS_JOB_PATH.exists(), f"Encoders file {ENCODERS_JOB_PATH} missing"
    
    clf = joblib.load(MODEL_JOB_PATH)
    assert hasattr(clf, "predict_proba"), "Loaded model does not support predict_proba"
    assert clf.n_features_in_ == len(expected_features)


def test_api_delay_predictions_endpoint(client, ministry_headers):
    """Test 5: GET /api/v1/analytics/predictions/delay-risk returns 200 with paginated items."""
    res = client.get("/api/v1/analytics/predictions/delay-risk?page=1&page_size=10", headers=ministry_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "pagination" in data
    assert data["pagination"]["total_records"] == 54408
    assert len(data["items"]) == 10
    
    first = data["items"][0]
    assert "work_id" in first
    assert "predicted_completion_risk" in first
    assert "predicted_risk_severity" in first
    assert first["predicted_risk_severity"] in ["HIGH", "MEDIUM", "LOW"]
    assert "explanation" in first


def test_api_delay_predictions_rbac_scoping(client, state_up_headers, district_patna_headers):
    """Test 6: Jurisdictional RBAC scoping filters records to authorized territory."""
    # State Officer (Uttar Pradesh)
    res_up = client.get("/api/v1/analytics/predictions/delay-risk?page=1&page_size=20", headers=state_up_headers)
    assert res_up.status_code == 200
    data_up = res_up.json()
    up_items = data_up["items"]
    assert len(up_items) > 0
    
    session = get_session()
    try:
        up_work_ids = [item["work_id"] for item in up_items]
        up_works = session.query(Work).filter(Work.work_id.in_(up_work_ids)).all()
        for w in up_works:
            assert w.state == "Uttar Pradesh", f"Work {w.work_id} state {w.state} != Uttar Pradesh"
            
        # District Officer (Patna, Bihar)
        res_patna = client.get("/api/v1/analytics/predictions/delay-risk?page=1&page_size=20", headers=district_patna_headers)
        assert res_patna.status_code == 200
        data_patna = res_patna.json()
        patna_items = data_patna["items"]
        assert len(patna_items) > 0
        
        patna_work_ids = [item["work_id"] for item in patna_items]
        patna_works = session.query(Work).filter(Work.work_id.in_(patna_work_ids)).all()
        for w in patna_works:
            assert w.district.upper() == "PATNA", f"Work {w.work_id} district {w.district} != Patna"
    finally:
        session.close()


def test_api_delay_prediction_single_work_detail(client, ministry_headers):
    """Test 7: GET /api/v1/analytics/predictions/delay-risk/{work_id} returns detailed diagnosis."""
    res_list = client.get("/api/v1/analytics/predictions/delay-risk?page=1&page_size=1", headers=ministry_headers)
    assert res_list.status_code == 200
    target_id = res_list.json()["items"][0]["work_id"]
    
    res_detail = client.get(f"/api/v1/analytics/predictions/delay-risk/{target_id}", headers=ministry_headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["work_id"] == target_id
    assert "predicted_completion_risk" in detail
    assert "state" in detail
    assert "district" in detail
    assert "work_status" in detail
