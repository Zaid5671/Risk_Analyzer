from typing import List, Optional, Dict
from pathlib import Path
import pandas as pd
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from api.dependencies import get_db
from api.auth import CurrentUser
from api import cache
from api.config import settings
from api.schemas.summaries import DistrictSummaryItem, MPSummaryItem

router = APIRouter(prefix="/analytics", tags=["Aggregations & Governance Summaries"])

TRENDS_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "model_outputs" / "trends" / "trend_quarterly_rollups.parquet"
_DUP_CACHE: Optional[Dict] = None


def get_duplicate_district_cache() -> Dict:
    global _DUP_CACHE
    if _DUP_CACHE is not None:
        return _DUP_CACHE
    if TRENDS_FILE.exists():
        try:
            df_dup_t = pd.read_parquet(TRENDS_FILE, columns=["grain_type", "state", "district", "unique_duplicate_works_count"])
            dup_dists = df_dup_t[df_dup_t["grain_type"] == "DISTRICT"].groupby(["state", "district"])["unique_duplicate_works_count"].sum()
            _DUP_CACHE = {(str(s).upper(), str(d).upper()): int(v) for (s, d), v in dup_dists.items()}
        except Exception:
            _DUP_CACHE = {}
    else:
        _DUP_CACHE = {}
    return _DUP_CACHE

@router.get("/district-summary", response_model=List[DistrictSummaryItem])
def get_district_summary(
    state: Optional[str] = Query(None, description="Filter by state"),
    limit: int = Query(50, ge=1, le=settings.SUMMARY_MAX_LIMIT, description="Max districts to return (861 districts exist)"),
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """Aggregates work counts, budgets, and independent high-severity flags by district with RBAC scoping."""
    where_conditions = []
    params = {"limit": limit}

    if current_user:
        if current_user.role == "STATE_OFFICER":
            where_conditions.append("w.state = :user_state")
            params["user_state"] = current_user.assigned_state
        elif current_user.role == "DISTRICT_OFFICER":
            where_conditions.append("w.state = :user_state AND w.district = :user_district")
            params["user_state"] = current_user.assigned_state
            params["user_district"] = current_user.assigned_district
        elif current_user.role == "MP":
            where_conditions.append("w.mp_name = :user_mp_name")
            params["user_mp_name"] = current_user.assigned_mp_name

    if state:
        where_conditions.append("w.state = :filter_state")
        params["filter_state"] = state

    where_clause = ("WHERE " + " AND ".join(where_conditions)) if where_conditions else ""

    sql = f"""
    SELECT
        w.state,
        w.district,
        count(*) AS total_works,
        COALESCE(sum(w.sanction_amount), 0) AS total_sanctioned_amount,
        COALESCE(sum(w.amount_disbursed), 0) AS total_disbursed_amount,
        count(c.work_id) AS high_cost_anomalies,
        count(d.work_id) AS high_delays,
        count(f.work_id) AS high_fund_anomalies
    FROM works w
    LEFT JOIN cost_anomaly_results c ON w.work_id = c.work_id AND c.severity = 'HIGH'
    LEFT JOIN delay_results d ON w.work_id = d.work_id AND d.severity = 'HIGH'
    LEFT JOIN fund_expenditure_results f ON w.work_id = f.work_id AND f.severity = 'HIGH'
    {where_clause}
    GROUP BY w.state, w.district
    ORDER BY total_sanctioned_amount DESC
    LIMIT :limit;
    """

    # Analytical tables are static while the API runs, so each scope/filter combination is computed once
    rows = cache.get_or_compute(
        ("district-summary", tuple(sorted(params.items()))),
        lambda: db.execute(text(sql), params).fetchall(),
    )

    dup_cache = get_duplicate_district_cache()

    results = []
    for r in rows:
        st, dist = r[0], r[1]
        dup_count = dup_cache.get((str(st).upper(), str(dist).upper()), 0)
        results.append(DistrictSummaryItem(
            state=st,
            district=dist,
            total_works=r[2],
            total_sanctioned_amount=float(r[3]),
            total_disbursed_amount=float(r[4]),
            high_cost_anomalies=r[5],
            high_delays=r[6],
            high_fund_anomalies=r[7],
            high_duplicate_pairs=dup_count
        ))
    return results

@router.get("/mp-summary", response_model=List[MPSummaryItem])
def get_mp_summary(
    mp_name: Optional[str] = Query(None, description="Search keyword in MP name"),
    limit: int = Query(50, ge=1, le=settings.SUMMARY_MAX_LIMIT, description="Max MPs to return"),
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """Aggregates work counts, completion rate, and independent risk counts by MP with RBAC scoping."""
    where_conditions = ["w.mp_name IS NOT NULL"]
    params = {"limit": limit}

    if current_user:
        if current_user.role == "STATE_OFFICER":
            where_conditions.append("w.state = :user_state")
            params["user_state"] = current_user.assigned_state
        elif current_user.role == "DISTRICT_OFFICER":
            where_conditions.append("w.state = :user_state AND w.district = :user_district")
            params["user_state"] = current_user.assigned_state
            params["user_district"] = current_user.assigned_district
        elif current_user.role == "MP":
            where_conditions.append("w.mp_name = :user_mp_name")
            params["user_mp_name"] = current_user.assigned_mp_name

    if mp_name:
        where_conditions.append("w.mp_name ILIKE :filter_mp_name")
        params["filter_mp_name"] = f"%{mp_name}%"

    where_clause = "WHERE " + " AND ".join(where_conditions)
    sql = f"""
    SELECT
        w.mp_name,
        COALESCE(max(w.house), 'Lok Sabha') AS house,
        COALESCE(max(w.state), 'Unknown') AS state,
        COALESCE(max(w.constituency), 'Unknown') AS constituency,
        count(*) AS total_works,
        COALESCE(sum(w.sanction_amount), 0) AS total_sanctioned_amount,
        count(*) FILTER (WHERE w.is_completed_flag) AS completed_works,
        count(c.work_id) AS high_cost_anomalies,
        count(f.work_id) AS high_fund_anomalies,
        count(d.work_id) AS high_delays
    FROM works w
    LEFT JOIN cost_anomaly_results c ON w.work_id = c.work_id AND c.severity = 'HIGH'
    LEFT JOIN fund_expenditure_results f ON w.work_id = f.work_id AND f.severity = 'HIGH'
    LEFT JOIN delay_results d ON w.work_id = d.work_id AND d.severity = 'HIGH'
    {where_clause}
    GROUP BY w.mp_name
    ORDER BY total_works DESC
    LIMIT :limit;
    """

    rows = cache.get_or_compute(
        ("mp-summary", tuple(sorted(params.items()))),
        lambda: db.execute(text(sql), params).fetchall(),
    )

    results = []
    for r in rows:
        tot = r[4]
        comp = r[6]
        rate = round((comp / tot) * 100.0, 1) if tot > 0 else 0.0
        results.append(MPSummaryItem(
            mp_name=r[0],
            house=r[1],
            state=r[2],
            constituency=r[3],
            total_works=tot,
            total_sanctioned_amount=float(r[5]),
            completed_works=comp,
            completion_rate=rate,
            high_cost_anomalies=r[7],
            high_fund_anomalies=r[8],
            high_delays=r[9]
        ))
    return results
