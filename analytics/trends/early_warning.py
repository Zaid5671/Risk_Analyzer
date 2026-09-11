# -*- coding: utf-8 -*-
"""
Early Warning Engine for MPLADS Platform
SIH Problem Statement: SIH PS 26102

Generates actionable pre-breach alerts grounded in official MoSPI statutory guidelines
and empirical statistical distributions.
"""

from typing import Dict, List, Optional, Any
from datetime import datetime
import pandas as pd
import numpy as np


FIXED_REFERENCE_DATE = pd.to_datetime("2026-09-05")


def generate_sla_near_miss_alerts(
    df_works: pd.DataFrame,
    ref_date: pd.Timestamp = FIXED_REFERENCE_DATE
) -> List[Dict[str, Any]]:
    """
    Statutory Early-Warning: Identifies works sanctioned between 45 and 74 days after recommendation,
    barely complying before the 75-day statutory SLA (retrospective near-miss analysis).
    Official Basis: MPLADS Guidelines Para 3.12 (75-day sanction SLA, 45-day rejection deadline).
    """
    alerts = []
    
    rec_dt = pd.to_datetime(df_works["recommended_date"], errors="coerce")
    sanc_dt = pd.to_datetime(df_works["sanction_date"], errors="coerce")

    # In canonical data, all works have sanction_date, so we check rec_to_sanc_days
    rec_to_sanc = (sanc_dt - rec_dt).dt.days

    # Filter works in the 45-74 day window
    mask = (rec_to_sanc >= 45) & (rec_to_sanc <= 74)
    cliff_df = df_works[mask]

    for idx, row in cliff_df.iterrows():
        elapsed = int(row["rec_to_sanc_days"]) if "rec_to_sanc_days" in row and pd.notna(row["rec_to_sanc_days"]) else int(rec_to_sanc.loc[idx])
        days_rem = max(1, 75 - elapsed)
        urgency = "CRITICAL" if elapsed >= 60 else "WATCHLIST"
        
        alerts.append({
            "work_id": str(row["work_id"]),
            "state": str(row["state"]),
            "district": str(row["district"]),
            "mp_name": str(row.get("mp_name", "N/A")),
            "sanction_amount": float(row.get("sanction_amount", 0.0) or 0.0),
            "work_type_template": str(row.get("work_type_template", "N/A")),
            "warning_type": "SLA_NEAR_MISS",
            "paradigm": "STATUTORY",
            "days_elapsed": elapsed,
            "days_to_statutory_breach": days_rem,
            "urgency_level": urgency,
            "action_recommended": f"District Authority sanctioned this work at day {elapsed} of 75-day SLA. Pattern indicates systemic near-deadline processing — recommend capacity review."
        })

    return alerts


# Backward compatibility alias
generate_sla_cliff_alerts = generate_sla_near_miss_alerts


def generate_approaching_dormancy_alerts(
    df_consolidated: pd.DataFrame,
    ref_date: pd.Timestamp = FIXED_REFERENCE_DATE
) -> List[Dict[str, Any]]:
    """
    Predictive Forward-Looking Early-Warning: Identifies open/incomplete works
    sanctioned between 270 and 364 days ago with zero fund disbursement.
    Official Basis: MPLADS Guidelines statutory 1-year (365-day) completion limit.
    Works at 270+ days with zero disbursement are on the brink of statutory dormancy.
    """
    alerts = []
    sanc_dt = pd.to_datetime(df_consolidated["sanction_date"], errors="coerce")
    aging_days = (ref_date - sanc_dt).dt.days

    disbursed = df_consolidated["amount_disbursed"].fillna(0)
    status = df_consolidated["work_status"].fillna("")

    # Incomplete works with zero disbursement aged 270-364 days
    mask = (
        (disbursed == 0) &
        (aging_days >= 270) &
        (aging_days <= 364) &
        (status != "Work Completed")
    )

    dormancy_df = df_consolidated[mask]

    for idx, row in dormancy_df.iterrows():
        elapsed = int(aging_days.loc[idx])
        days_to_dormant = max(1, 365 - elapsed)
        urgency = "CRITICAL" if elapsed >= 330 else "WATCHLIST"

        alerts.append({
            "work_id": str(row["work_id"]),
            "state": str(row["state"]),
            "district": str(row["district"]),
            "mp_name": str(row.get("mp_name", "N/A")),
            "sanction_amount": float(row.get("sanction_amount", 0.0) or 0.0),
            "work_type_template": str(row.get("work_type_template", "N/A")),
            "warning_type": "APPROACHING_DORMANCY",
            "paradigm": "PREDICTIVE",
            "days_elapsed": elapsed,
            "days_to_statutory_breach": days_to_dormant,
            "urgency_level": urgency,
            "action_recommended": f"Sanctioned {elapsed} days ago with zero disbursement ({days_to_dormant} days until statutory 1-year dormancy limit). Immediate intervention required to prevent statutory lapse."
        })

    return alerts


def generate_stagnation_incubation_alerts(
    df_consolidated: pd.DataFrame,
    ref_date: pd.Timestamp = FIXED_REFERENCE_DATE
) -> List[Dict[str, Any]]:
    """
    Statistical Early-Warning: Identifies sanctioned works aged 180 to 365 days
    with zero fund disbursement.
    Empirical Basis: 75% of normal works disburse first payment within 162 days.
    Reaching 180 days with zero spend places a work in the slowest quartile and halfway
    to the statutory 365-day completion limit.
    """
    alerts = []
    sanc_dt = pd.to_datetime(df_consolidated["sanction_date"], errors="coerce")
    aging_days = (ref_date - sanc_dt).dt.days

    # Check disbursed amount
    disbursed = df_consolidated["amount_disbursed"].fillna(0)
    status = df_consolidated["work_status"].fillna("")

    # Zero spend works in 180-365 day incubation window
    mask = (
        (disbursed == 0) &
        (aging_days >= 180) &
        (aging_days <= 365) &
        (status.isin(["Sanction", "Vendor Identification", "Ongoing", "Work in Progress"]))
    )
    
    stagnant_df = df_consolidated[mask]

    for idx, row in stagnant_df.iterrows():
        elapsed = int(aging_days.loc[idx])
        days_to_dormant = max(1, 365 - elapsed)
        urgency = "CRITICAL" if elapsed >= 270 else "WATCHLIST"

        alerts.append({
            "work_id": str(row["work_id"]),
            "state": str(row["state"]),
            "district": str(row["district"]),
            "mp_name": str(row.get("mp_name", "N/A")),
            "sanction_amount": float(row.get("sanction_amount", 0.0) or 0.0),
            "work_type_template": str(row.get("work_type_template", "N/A")),
            "warning_type": "STAGNATION_INCUBATION",
            "paradigm": "STATISTICAL",
            "days_elapsed": elapsed,
            "days_to_statutory_breach": days_to_dormant,
            "urgency_level": urgency,
            "action_recommended": f"Verify implementing agency contractor engagement. Work is halfway to 1-year completion limit with zero disbursement ({days_to_dormant} days before statutory dormancy)."
        })

    return alerts


def generate_batch_duplicate_cluster_alerts(
    df_dup: pd.DataFrame,
    df_works: pd.DataFrame
) -> List[Dict[str, Any]]:
    """
    Statistical Early-Warning: Identifies works participating in large duplicate clusters
    sanctioned in close temporal proximity (same day or <= 15 days).
    Empirical Basis: 93.5% of duplicates occur within 15 days; median cluster degree is 8 works.
    Targets tender splitting and bulk tender duplication risk.
    """
    alerts = []
    high_dup = df_dup[(df_dup["severity"] == "HIGH") & (df_dup["days_diff"] <= 15)]

    # Identify works appearing in >= 3 high duplicate pairs within 15 days
    w_counts = pd.concat([high_dup["work_id_1"], high_dup["work_id_2"]]).value_counts()
    cluster_work_ids = set(w_counts[w_counts >= 3].index)

    if not cluster_work_ids:
        return alerts

    works_sub = df_works[df_works["work_id"].isin(cluster_work_ids)]

    for _, row in works_sub.iterrows():
        w_id = str(row["work_id"])
        deg = int(w_counts[w_id])
        urgency = "CRITICAL" if deg >= 10 else "WATCHLIST"

        alerts.append({
            "work_id": w_id,
            "state": str(row["state"]),
            "district": str(row["district"]),
            "mp_name": str(row.get("mp_name", "N/A")),
            "sanction_amount": float(row.get("sanction_amount", 0.0) or 0.0),
            "work_type_template": str(row.get("work_type_template", "N/A")),
            "warning_type": "BATCH_DUPLICATE_CLUSTER",
            "paradigm": "STATISTICAL",
            "days_elapsed": 0,
            "days_to_statutory_breach": None,
            "urgency_level": urgency,
            "action_recommended": f"Audit potential tender splitting or redundant asset allocation. Work matches {deg} other works sanctioned within 15 days."
        })

    return alerts


def compile_all_early_warnings(
    df_consolidated: pd.DataFrame,
    df_dup: pd.DataFrame,
    ref_date: pd.Timestamp = FIXED_REFERENCE_DATE
) -> List[Dict[str, Any]]:
    """
    Compiles all early warning alerts across statutory, predictive, and statistical paradigms.
    """
    alerts_sla = generate_sla_near_miss_alerts(df_consolidated, ref_date)
    alerts_dormancy = generate_approaching_dormancy_alerts(df_consolidated, ref_date)
    alerts_stagnation = generate_stagnation_incubation_alerts(df_consolidated, ref_date)
    alerts_batch = generate_batch_duplicate_cluster_alerts(df_dup, df_consolidated)

    all_alerts = alerts_sla + alerts_dormancy + alerts_stagnation + alerts_batch
    return all_alerts
