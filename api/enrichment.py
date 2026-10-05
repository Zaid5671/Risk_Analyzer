"""
Attaches human-readable context to model result items for list views.

Each list endpoint returns at most one page (<= 100 items), so the work context is
fetched with a single `IN (...)` query per page. Reasons are short plain-language
sentences built from the stored numeric fields, so they read the same in every view.
"""
from datetime import date
from pathlib import Path
from typing import Dict, Iterable, Optional, Tuple

import pandas as pd
from sqlalchemy.orm import Session

from api import cache
from api.config import settings
from api.schemas.common import WorkBrief
from database.models import Work

COST_FEATURES_PARQUET = (
    Path(__file__).resolve().parent.parent / "data" / "features" / "cost" / "cost_anomaly_features.parquet"
)
REFERENCE_DATE = date.fromisoformat(settings.DATA_REFERENCE_DATE)


# ---------------------------------------------------------------------------
# Formatting
# ---------------------------------------------------------------------------

def format_inr(amount: Optional[float]) -> str:
    """Compact Indian-style rupee amount: ₹45,000 · ₹20 L · ₹1.25 Cr."""
    if amount is None:
        return "—"
    amount = float(amount)
    if abs(amount) >= 1e7:
        return f"₹{amount / 1e7:,.2f}".rstrip("0").rstrip(".") + " Cr"
    if abs(amount) >= 1e5:
        return f"₹{amount / 1e5:,.2f}".rstrip("0").rstrip(".") + " L"
    # Indian digit grouping below one lakh is the same as Western grouping
    return f"₹{amount:,.0f}"


def _ratio_phrase(ratio: float) -> str:
    if ratio >= 2:
        return f"{ratio:.1f}× the typical cost".replace(".0×", "×")
    if ratio >= 1:
        return f"{(ratio - 1) * 100:.0f}% above the typical cost"
    return f"{(1 - ratio) * 100:.0f}% below the typical cost"


def _plural(n: int, word: str) -> str:
    return f"{n:,} {word}{'' if n == 1 else 's'}"


# ---------------------------------------------------------------------------
# Lookups
# ---------------------------------------------------------------------------

def fetch_work_briefs(db: Session, work_ids: Iterable[str]) -> Dict[str, WorkBrief]:
    ids = list({w for w in work_ids if w})
    if not ids:
        return {}
    rows = db.query(
        Work.work_id, Work.work_description, Work.work_type, Work.state, Work.district,
        Work.mp_name, Work.work_status, Work.sanction_amount, Work.amount_disbursed, Work.sanction_date,
    ).filter(Work.work_id.in_(ids)).all()
    return {r.work_id: work_brief_from_row(r) for r in rows}


def work_brief_from_row(r) -> WorkBrief:
    return WorkBrief(
        work_id=r.work_id,
        work_description=(r.work_description or "").strip() or None,
        work_type=r.work_type,
        state=r.state,
        district=r.district,
        mp_name=r.mp_name,
        work_status=r.work_status,
        sanction_amount=float(r.sanction_amount) if r.sanction_amount is not None else None,
        amount_disbursed=float(r.amount_disbursed) if r.amount_disbursed is not None else None,
        sanction_date=r.sanction_date.isoformat() if r.sanction_date else None,
    )


def _load_cost_peer_stats() -> Dict[str, Tuple[Optional[float], Optional[float]]]:
    df = pd.read_parquet(COST_FEATURES_PARQUET, columns=["work_id", "peer_median_amount", "cost_ratio_vs_peer_median"])
    df = df.astype(object).where(pd.notna(df), None)
    return {r[0]: (r[1], r[2]) for r in df.itertuples(index=False)}


def cost_peer_stats() -> Dict[str, Tuple[Optional[float], Optional[float]]]:
    """work_id -> (peer_median_amount, cost_ratio_vs_peer_median), from the Model 1 feature registry."""
    return cache.get_or_compute("cost_peer_stats", _load_cost_peer_stats)


def _days_since(iso_date: Optional[str]) -> Optional[int]:
    if not iso_date:
        return None
    return (REFERENCE_DATE - date.fromisoformat(iso_date)).days


# ---------------------------------------------------------------------------
# Plain-language reasons
# ---------------------------------------------------------------------------

def cost_reason(item, work: Optional[WorkBrief]) -> Optional[str]:
    if item.severity == "DATA_QUALITY_EXCEPTION":
        amt = format_inr(work.sanction_amount) if work else "a tiny amount"
        return f"Sanctioned for {amt} — likely a data-entry error, flagged for correction"
    if item.severity == "INSUFFICIENT_PEER_DATA":
        return "Too few comparable works nationally to judge this cost"
    if item.peer_median_amount and work and work.sanction_amount is not None:
        ratio = item.cost_ratio_vs_peer_median or (work.sanction_amount / item.peer_median_amount)
        where = "across India" if (item.peer_group_level or "").startswith("NATIONAL") else f"in {work.state}"
        what = work.work_type or "similar works"
        return (
            f"{format_inr(work.sanction_amount)} vs typical {format_inr(item.peer_median_amount)} "
            f"for “{what}” {where} — {_ratio_phrase(ratio)}"
        )
    return None


def fund_reason(item, work: Optional[WorkBrief]) -> Optional[str]:
    category = item.audit_category
    if category == "STATUS_EXPENDITURE_MISMATCH":
        status = (work.work_status if work and work.work_status else "completed").lower()
        return f"Marked “{status}” on the portal, but no payment has ever been recorded"
    if category == "DORMANT_SANCTION":
        days = _days_since(work.sanction_date) if work else None
        span = f"{_plural(days, 'day')} after sanction" if days else "over a year after sanction"
        amt = f"{format_inr(work.sanction_amount)} sanctioned, " if work and work.sanction_amount else ""
        return f"{amt}nothing spent {span}"
    if category == "NORMAL_AWAITING_DISBURSEMENT":
        return "Recently sanctioned — awaiting first payment (normal)"

    # ACTIVE_EXPENDITURE: describe the strongest observed signal
    reasons = set(item.anomaly_reasons or [])
    util = f"{item.utilization_ratio * 100:.0f}%" if item.utilization_ratio is not None else None
    if "PROLONGED_DISBURSEMENT_LATENCY" in reasons and item.days_to_first_disbursement:
        return f"First payment only {_plural(int(item.days_to_first_disbursement), 'day')} after sanction"
    if "EXTREME_TRANCHE_FRAGMENTATION" in reasons and item.transaction_count:
        return f"Paid out in {_plural(item.transaction_count, 'small instalment')} — unusually fragmented"
    if "LARGE_LUMP_SUM_RAPID_DRAIN" in reasons:
        return "Large lump sum drained unusually fast after sanction"
    if ("SEVERE_UNDER_UTILIZATION" in reasons or "LOW_UTILIZATION_COMPLETED" in reasons) and util:
        return f"Only {util} of the sanctioned budget used"
    if item.severity in ("HIGH", "MEDIUM"):
        parts = [p for p in (
            f"{util} of budget used" if util else None,
            _plural(item.transaction_count, "payment") if item.transaction_count else None,
            f"first payment after {_plural(int(item.days_to_first_disbursement), 'day')}"
            if item.days_to_first_disbursement else None,
        ) if p]
        return "Unusual payment pattern" + (f": {', '.join(parts)}" if parts else "")
    return "Payment pattern consistent with typical MPLADS works"


_SEVERITY_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}


def delay_reason(item, work: Optional[WorkBrief]) -> Optional[str]:
    # Each statutory track is judged separately; lead with the most severe breach, not the
    # engine's "primary" type (which can be a 2-day sanction slip on a work 347 days overdue).
    breaches = []
    if item.rec_to_sanc_delay_days and item.rec_to_sanc_delay_days > 0 and item.rec_to_sanc_days is not None:
        breaches.append((item.rec_to_sanc_severity,
                         f"sanctioned {_plural(item.rec_to_sanc_days, 'day')} after the MP’s recommendation (limit: 75)"))
    if item.sanc_to_comp_delay_days and item.sanc_to_comp_delay_days > 0 and item.sanc_to_comp_days is not None:
        breaches.append((item.sanc_to_comp_severity,
                         f"took {_plural(item.sanc_to_comp_days, 'day')} to complete (limit: 365)"))
    if item.open_work_overdue_days and item.open_work_overdue_days > 0 and item.open_work_aging_days is not None:
        breaches.append((item.open_work_aging_severity,
                         f"still open {_plural(item.open_work_aging_days, 'day')} after sanction (limit: 365)"))
    if not breaches:
        return "Within all statutory timelines"
    breaches.sort(key=lambda b: -_SEVERITY_RANK.get(b[0] or "", 0))
    text = " · ".join(b[1] for b in breaches[:2])
    return text[0].upper() + text[1:]


def prediction_reason(item, work: Optional[WorkBrief]) -> Optional[str]:
    pct = f"{item.predicted_completion_risk * 100:.0f}%"
    parts = [p for p in (
        f"{_plural(item.days_since_sanction, 'day')} since sanction" if item.days_since_sanction is not None else None,
        f"{item.current_utilization * 100:.0f}% of budget spent" if item.current_utilization is not None else None,
    ) if p]
    tail = f" · {', '.join(parts)}" if parts else ""
    return f"{pct} chance of missing the 365-day completion deadline{tail}"


# ---------------------------------------------------------------------------
# Attach helpers used by routers
# ---------------------------------------------------------------------------

def _attach(db: Session, items, reason_fn, briefs: Optional[Dict[str, WorkBrief]] = None):
    briefs = briefs if briefs is not None else fetch_work_briefs(db, (i.work_id for i in items))
    for item in items:
        item.work_info = briefs.get(item.work_id)
        item.reason = reason_fn(item, item.work_info)
    return items


def attach_cost_context(db: Session, items, briefs: Optional[Dict[str, WorkBrief]] = None):
    stats = cost_peer_stats()
    for item in items:
        median, ratio = stats.get(item.work_id, (None, None))
        item.peer_median_amount = float(median) if median is not None else None
        item.cost_ratio_vs_peer_median = float(ratio) if ratio is not None else None
    return _attach(db, items, cost_reason, briefs)


def attach_fund_context(db: Session, items, briefs: Optional[Dict[str, WorkBrief]] = None):
    return _attach(db, items, fund_reason, briefs)


def attach_delay_context(db: Session, items, briefs: Optional[Dict[str, WorkBrief]] = None):
    return _attach(db, items, delay_reason, briefs)


def attach_prediction_context(db: Session, items, briefs: Optional[Dict[str, WorkBrief]] = None):
    return _attach(db, items, prediction_reason, briefs)


def attach_duplicate_context(db: Session, items, briefs: Optional[Dict[str, WorkBrief]] = None):
    if briefs is None:
        ids = [i.work_id_1 for i in items] + [i.work_id_2 for i in items]
        briefs = fetch_work_briefs(db, ids)
    for item in items:
        item.work_1 = briefs.get(item.work_id_1)
        item.work_2 = briefs.get(item.work_id_2)
    return items
