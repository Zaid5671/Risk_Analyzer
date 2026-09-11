from typing import Optional
import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database.models import DelayPredictionResult, Work
from api.dependencies import get_db, PaginationParams
from api.auth import CurrentUser, apply_work_joined_scope, verify_work_jurisdiction
from api.schemas.prediction import (
    DelayPredictionItem,
    DelayPredictionDetail,
    DelayRiskSeverityEnum
)
from api.schemas.common import PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/analytics/predictions", tags=["Model 5 — Predictive Delay Risk"])

@router.get("/delay-risk", response_model=PaginatedResponse[DelayPredictionItem])
def list_delay_predictions(
    severity: Optional[DelayRiskSeverityEnum] = Query(None, description="Filter by predicted delay risk severity"),
    min_risk: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum predicted completion risk"),
    state: Optional[str] = Query(None, description="Filter by State (via joined work)"),
    district: Optional[str] = Query(None, description="Filter by District (via joined work)"),
    pagination: PaginationParams = Depends(),
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves ranked predictive delay risk forecasts for open/incomplete works
    with server-side jurisdictional RBAC scoping.
    """
    query = db.query(DelayPredictionResult)

    already_joined = False
    if state or district:
        query = query.join(Work, DelayPredictionResult.work_id == Work.work_id)
        already_joined = True
        if state:
            query = query.filter(Work.state == state)
        if district:
            query = query.filter(Work.district == district)

    # Server-side jurisdictional predicate injection
    query, _ = apply_work_joined_scope(query, current_user, DelayPredictionResult, already_joined=already_joined)

    if severity:
        query = query.filter(DelayPredictionResult.predicted_risk_severity == severity.value)
    if min_risk is not None:
        query = query.filter(DelayPredictionResult.predicted_completion_risk >= min_risk)

    total_records = query.count()
    items = (
        query.order_by(DelayPredictionResult.predicted_completion_risk.desc())
        .offset(pagination.offset)
        .limit(pagination.page_size)
        .all()
    )

    total_pages = math.ceil(total_records / pagination.page_size) if total_records > 0 else 1
    has_next = pagination.page < total_pages
    has_prev = pagination.page > 1

    formatted_items = [DelayPredictionItem.model_validate(item) for item in items]

    return PaginatedResponse[DelayPredictionItem](
        items=formatted_items,
        pagination=PaginationMeta(
            total_records=total_records,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=total_pages,
            has_next=has_next,
            has_prev=has_prev
        )
    )

@router.get("/delay-risk/{work_id:path}", response_model=DelayPredictionDetail)
def get_delay_prediction_detail(
    work_id: str,
    current_user: CurrentUser = None,
    db: Session = Depends(get_db)
):
    """
    Retrieves detailed predictive delay risk assessment for a single open work
    with joined work metadata and jurisdictional RBAC check.
    """
    clean_id = work_id.strip()
    record = (
        db.query(DelayPredictionResult, Work)
        .join(Work, DelayPredictionResult.work_id == Work.work_id)
        .filter(DelayPredictionResult.work_id == clean_id)
        .first()
    )
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Delay prediction record for work ID '{clean_id}' not found."
        )

    pred_res, work = record
    # Server-side 403 verification
    verify_work_jurisdiction(work, current_user)

    pred_dict = {c.name: getattr(pred_res, c.name) for c in pred_res.__table__.columns}

    return DelayPredictionDetail(
        **pred_dict,
        house=work.house,
        state=work.state,
        district=work.district,
        mp_name=work.mp_name,
        work_category=work.work_category,
        work_type=work.work_type,
        sanction_amount=float(work.sanction_amount) if work.sanction_amount is not None else None,
        amount_disbursed=float(work.amount_disbursed) if work.amount_disbursed is not None else None,
        work_status=work.work_status
    )
