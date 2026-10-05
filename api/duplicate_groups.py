"""
Groups Model 2's flagged duplicate pairs into sets of near-identical works.

Bulk sanctions (one MP approving N identical works on the same day) produce N·(N-1)/2
pairs, which drown the pair list. Collapsing pairs into connected components shows each
such batch once. Groups are computed once from the stored pairs and cached; jurisdiction
filtering is applied per request with the same rule as pairs (visible if any work is in scope).
"""
from collections import Counter
from dataclasses import dataclass, field
from datetime import date
from typing import Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from api import cache
from api.enrichment import format_inr, work_brief_from_row
from api.schemas.common import WorkBrief
from api.schemas.duplicate_work import DuplicateGroupItem
from database.models import User

MAX_WORKS_PER_GROUP = 50


@dataclass
class _Group:
    work_ids: List[str]
    pair_count: int = 0
    max_score: float = 0.0


@dataclass
class DuplicateIndex:
    pairs: List[tuple]                     # (work_id_1, work_id_2)
    briefs: Dict[str, WorkBrief]
    groups: List[DuplicateGroupItem] = field(default_factory=list)
    # Full membership per group_id (the item itself lists at most MAX_WORKS_PER_GROUP works)
    members: Dict[int, List[str]] = field(default_factory=dict)


def _build_index(db: Session) -> DuplicateIndex:
    pair_rows = db.execute(text(
        "SELECT work_id_1, work_id_2, duplicate_score FROM duplicate_work_results"
    )).fetchall()
    work_rows = db.execute(text("""
        SELECT work_id, work_description, work_type, state, district, mp_name, work_status,
               sanction_amount, amount_disbursed, sanction_date
        FROM works
        WHERE work_id IN (SELECT work_id_1 FROM duplicate_work_results
                          UNION SELECT work_id_2 FROM duplicate_work_results)
    """)).fetchall()
    briefs = {r.work_id: work_brief_from_row(r) for r in work_rows}

    # Union-find over the pair graph
    parent: Dict[str, str] = {}

    def find(x: str) -> str:
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b, _ in pair_rows:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    raw: Dict[str, _Group] = {}
    for a, b, score in pair_rows:
        g = raw.setdefault(find(a), _Group(work_ids=[]))
        g.pair_count += 1
        g.max_score = max(g.max_score, float(score))
    for w in parent:
        raw[find(w)].work_ids.append(w)

    built = [(_to_item(g, briefs), g.work_ids) for g in raw.values()]
    built.sort(key=lambda t: (-t[0].work_count, -t[0].total_sanctioned_amount))
    members: Dict[int, List[str]] = {}
    for i, (item, ids) in enumerate(built, start=1):
        item.group_id = i
        members[i] = ids

    return DuplicateIndex(
        pairs=[(a, b) for a, b, _ in pair_rows],
        briefs=briefs,
        groups=[item for item, _ in built],
        members=members,
    )


def _most_common(values) -> Optional[str]:
    values = [v for v in values if v]
    return Counter(values).most_common(1)[0][0] if values else None


def _to_item(g: _Group, briefs: Dict[str, WorkBrief]) -> DuplicateGroupItem:
    works = sorted(
        (briefs[w] for w in g.work_ids if w in briefs),
        key=lambda b: (b.sanction_date or "", b.work_id),
    )
    dates = [b.sanction_date for b in works if b.sanction_date]
    first, last = (min(dates), max(dates)) if dates else (None, None)
    span = (date.fromisoformat(last) - date.fromisoformat(first)).days if dates else None
    mps = sorted({b.mp_name for b in works if b.mp_name})
    total = sum(b.sanction_amount or 0.0 for b in works)
    description = _most_common(b.work_description for b in works)

    who = f"by {mps[0]}" if len(mps) == 1 else f"by {len(mps)} different MPs"
    when = (
        "on the same day" if span == 0
        else f"within {span} days" if span is not None
        else ""
    )
    desc_part = f" (“{description[:60]}{'…' if len(description) > 60 else ''}”)" if description else ""
    reason = f"{len(g.work_ids)} near-identical works{desc_part} sanctioned {who} {when}, totalling {format_inr(total)}"

    return DuplicateGroupItem(
        group_id=0,
        work_count=len(g.work_ids),
        pair_count=g.pair_count,
        max_duplicate_score=round(g.max_score, 4),
        work_description=description,
        work_type=_most_common(b.work_type for b in works),
        states=sorted({b.state for b in works if b.state}),
        districts=sorted({b.district for b in works if b.district}),
        mp_names=mps,
        is_single_mp=len(mps) <= 1,
        total_sanctioned_amount=round(total, 2),
        first_sanction_date=first,
        last_sanction_date=last,
        sanction_span_days=span,
        reason=" ".join(reason.split()),
        works=works[:MAX_WORKS_PER_GROUP],
        works_truncated=len(works) > MAX_WORKS_PER_GROUP,
    )


def get_index(db: Session) -> DuplicateIndex:
    return cache.get_or_compute("duplicate_index", lambda: _build_index(db))


def in_scope(brief: Optional[WorkBrief], user: User) -> bool:
    if user.role == "MINISTRY":
        return True
    if brief is None:
        return False
    if user.role == "STATE_OFFICER":
        return brief.state == user.assigned_state
    if user.role == "DISTRICT_OFFICER":
        return brief.state == user.assigned_state and brief.district == user.assigned_district
    if user.role == "MP":
        return brief.mp_name == user.assigned_mp_name
    return False


def scoped_groups(index: DuplicateIndex, user: User) -> List[DuplicateGroupItem]:
    if user.role == "MINISTRY":
        return index.groups
    b = index.briefs
    return [g for g in index.groups if any(in_scope(b.get(w), user) for w in index.members[g.group_id])]


def scoped_pair_count(index: DuplicateIndex, user: User) -> int:
    if user.role == "MINISTRY":
        return len(index.pairs)
    b = index.briefs
    return sum(1 for a, c in index.pairs if in_scope(b.get(a), user) or in_scope(b.get(c), user))
