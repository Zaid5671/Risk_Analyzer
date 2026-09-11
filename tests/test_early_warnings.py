# -*- coding: utf-8 -*-
"""
Automated Verification Suite for Early Warning Engine
SIH Problem Statement: SIH PS 26102
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path

from analytics.trends.early_warning import (
    generate_sla_near_miss_alerts,
    generate_sla_cliff_alerts,
    generate_approaching_dormancy_alerts,
    generate_stagnation_incubation_alerts,
    generate_batch_duplicate_cluster_alerts,
    compile_all_early_warnings,
    FIXED_REFERENCE_DATE
)

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
WARNINGS_PATH = DATA_DIR / "model_outputs" / "trends" / "early_warnings_active.parquet"


def test_sla_near_miss_boundary_conditions():
    """Validates 45-74 day statutory SLA near-miss threshold logic and warning details."""
    ref = pd.to_datetime("2026-09-05")
    mock_works = pd.DataFrame([
        {
            "work_id": "W_TOO_EARLY",
            "state": "Bihar", "district": "Patna", "mp_name": "MP 1", "sanction_amount": 100000.0, "work_type_template": "T",
            "recommended_date": "2026-07-25", "sanction_date": "2026-09-05", # 42 days (below 45d threshold)
            "rec_to_sanc_days": 42
        },
        {
            "work_id": "W_WATCHLIST",
            "state": "Bihar", "district": "Patna", "mp_name": "MP 1", "sanction_amount": 100000.0, "work_type_template": "T",
            "recommended_date": "2026-07-15", "sanction_date": "2026-09-05", # 52 days (WATCHLIST: 45-59d)
            "rec_to_sanc_days": 52
        },
        {
            "work_id": "W_CRITICAL",
            "state": "Bihar", "district": "Patna", "mp_name": "MP 1", "sanction_amount": 100000.0, "work_type_template": "T",
            "recommended_date": "2026-07-01", "sanction_date": "2026-09-05", # 66 days (CRITICAL: 60-74d)
            "rec_to_sanc_days": 66
        },
        {
            "work_id": "W_ALREADY_BREACHED",
            "state": "Bihar", "district": "Patna", "mp_name": "MP 1", "sanction_amount": 100000.0, "work_type_template": "T",
            "recommended_date": "2026-06-15", "sanction_date": "2026-09-05", # 82 days (Already breached >75d, not in near miss)
            "rec_to_sanc_days": 82
        }
    ])

    alerts = generate_sla_near_miss_alerts(mock_works, ref_date=ref)
    alert_ids = {a["work_id"] for a in alerts}

    assert "W_TOO_EARLY" not in alert_ids
    assert "W_WATCHLIST" in alert_ids
    assert "W_CRITICAL" in alert_ids
    assert "W_ALREADY_BREACHED" not in alert_ids

    # Verify warning type & recommended action
    for a in alerts:
        assert a["warning_type"] == "SLA_NEAR_MISS"
        assert a["paradigm"] == "STATUTORY"
        assert "District Authority sanctioned this work at day" in a["action_recommended"]

    # Verify urgency tiers
    w_alert = next(a for a in alerts if a["work_id"] == "W_WATCHLIST")
    assert w_alert["urgency_level"] == "WATCHLIST"
    assert w_alert["days_to_statutory_breach"] == 75 - 52  # 23 days

    c_alert = next(a for a in alerts if a["work_id"] == "W_CRITICAL")
    assert c_alert["urgency_level"] == "CRITICAL"
    assert c_alert["days_to_statutory_breach"] == 75 - 66  # 9 days

    # Verify alias works
    alias_alerts = generate_sla_cliff_alerts(mock_works, ref_date=ref)
    assert len(alias_alerts) == len(alerts)


def test_approaching_dormancy_boundary_conditions():
    """Validates 270-364 day predictive approaching dormancy threshold logic."""
    ref = pd.to_datetime("2026-09-05")
    mock_works = pd.DataFrame([
        {
            "work_id": "W_TOO_NEW",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 300000.0, "work_type_template": "Road",
            "sanction_date": "2026-02-01",  # ~216 days (< 270d)
            "amount_disbursed": 0.0,
            "work_status": "Sanction"
        },
        {
            "work_id": "W_WATCHLIST_DORM",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 300000.0, "work_type_template": "Road",
            "sanction_date": "2025-11-15",  # 294 days (270-329d -> WATCHLIST)
            "amount_disbursed": 0.0,
            "work_status": "Sanction"
        },
        {
            "work_id": "W_CRITICAL_DORM",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 300000.0, "work_type_template": "Road",
            "sanction_date": "2025-09-25",  # 345 days (330-364d -> CRITICAL)
            "amount_disbursed": 0.0,
            "work_status": "Physical Inspection"
        },
        {
            "work_id": "W_PAST_YEAR",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 300000.0, "work_type_template": "Road",
            "sanction_date": "2025-08-01",  # 400 days (> 364d, already dormant)
            "amount_disbursed": 0.0,
            "work_status": "Sanction"
        },
        {
            "work_id": "W_HAS_FUNDS",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 300000.0, "work_type_template": "Road",
            "sanction_date": "2025-09-25",  # 345 days, but has disbursement
            "amount_disbursed": 150000.0,
            "work_status": "Work partially Completed"
        },
        {
            "work_id": "W_COMPLETED",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 300000.0, "work_type_template": "Road",
            "sanction_date": "2025-09-25",  # 345 days, 0 disbursed, but completed
            "amount_disbursed": 0.0,
            "work_status": "Work Completed"
        }
    ])

    alerts = generate_approaching_dormancy_alerts(mock_works, ref_date=ref)
    alert_ids = {a["work_id"] for a in alerts}

    assert "W_TOO_NEW" not in alert_ids
    assert "W_WATCHLIST_DORM" in alert_ids
    assert "W_CRITICAL_DORM" in alert_ids
    assert "W_PAST_YEAR" not in alert_ids
    assert "W_HAS_FUNDS" not in alert_ids
    assert "W_COMPLETED" not in alert_ids

    # Verify warning type & paradigm
    w_alert = next(a for a in alerts if a["work_id"] == "W_WATCHLIST_DORM")
    assert w_alert["warning_type"] == "APPROACHING_DORMANCY"
    assert w_alert["paradigm"] == "PREDICTIVE"
    assert w_alert["urgency_level"] == "WATCHLIST"
    assert w_alert["days_to_statutory_breach"] == 365 - 294

    c_alert = next(a for a in alerts if a["work_id"] == "W_CRITICAL_DORM")
    assert c_alert["warning_type"] == "APPROACHING_DORMANCY"
    assert c_alert["paradigm"] == "PREDICTIVE"
    assert c_alert["urgency_level"] == "CRITICAL"
    assert c_alert["days_to_statutory_breach"] == 365 - 345


def test_stagnation_incubation_boundary_conditions():
    """Validates 180-365 day statistical stagnation incubation threshold logic."""
    ref = pd.to_datetime("2026-09-05")
    mock_fund = pd.DataFrame([
        {
            "work_id": "W_RECENT",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 500000.0, "work_type_template": "Road",
            "sanction_date": "2026-06-01",  # ~96 days old (< 180d)
            "amount_disbursed": 0.0,
            "work_status": "Sanction"
        },
        {
            "work_id": "W_INCUBATING",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 500000.0, "work_type_template": "Road",
            "sanction_date": "2026-01-01",  # ~247 days old (180-365d)
            "amount_disbursed": 0.0,
            "work_status": "Sanction"
        },
        {
            "work_id": "W_ACTIVE_DISBURSED",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 500000.0, "work_type_template": "Road",
            "sanction_date": "2026-01-01",  # ~247 days old, but disbursed
            "amount_disbursed": 250000.0,
            "work_status": "Sanction"
        },
        {
            "work_id": "W_DORMANT",
            "state": "UP", "district": "Varanasi", "mp_name": "MP 2", "sanction_amount": 500000.0, "work_type_template": "Road",
            "sanction_date": "2025-01-01",  # > 365 days old (Full dormant sanction, not incubation)
            "amount_disbursed": 0.0,
            "work_status": "Sanction"
        }
    ])

    alerts = generate_stagnation_incubation_alerts(mock_fund, ref_date=ref)
    alert_ids = {a["work_id"] for a in alerts}

    assert "W_RECENT" not in alert_ids
    assert "W_INCUBATING" in alert_ids
    assert "W_ACTIVE_DISBURSED" not in alert_ids
    assert "W_DORMANT" not in alert_ids


def test_early_warnings_persisted_dataset():
    """Validates the live persisted early warnings dataset."""
    assert WARNINGS_PATH.exists()
    df = pd.read_parquet(WARNINGS_PATH)

    assert len(df) > 0
    assert "warning_type" in df.columns
    assert "urgency_level" in df.columns
    assert "paradigm" in df.columns

    # Verify paradigms
    paradigms = df["paradigm"].unique().tolist()
    assert "STATUTORY" in paradigms
    assert "STATISTICAL" in paradigms
    assert "PREDICTIVE" in paradigms

    # Verify warning types
    warning_types = df["warning_type"].unique().tolist()
    assert "SLA_NEAR_MISS" in warning_types
    assert "APPROACHING_DORMANCY" in warning_types

    # Urgency levels
    urgencies = df["urgency_level"].unique().tolist()
    assert set(urgencies).issubset({"CRITICAL", "WATCHLIST"})
