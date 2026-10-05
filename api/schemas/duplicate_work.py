from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, ConfigDict
from api.schemas.common import WorkBrief

class DuplicateSeverityEnum(str, Enum):
    HIGH = "HIGH"
    REVIEW = "REVIEW"
    LOW = "LOW"

class DuplicatePairItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    work_id_1: str
    work_id_2: str
    duplicate_score: float
    severity: str
    confidence: Optional[float] = None
    semantic_similarity: Optional[float] = None
    structural_score: Optional[float] = None
    amount_similarity: Optional[float] = None
    date_proximity: Optional[float] = None
    days_diff: Optional[int] = None
    is_same_mp: Optional[bool] = None
    is_same_constituency: Optional[bool] = None
    explanation: Optional[str] = None
    # Additive context: both works, so lists can show what is being compared
    work_1: Optional[WorkBrief] = None
    work_2: Optional[WorkBrief] = None

class WorkDuplicateLookupResponse(BaseModel):
    work_id: str
    total_flagged_pairs: int
    pairs: List[DuplicatePairItem]

class DuplicateGroupItem(BaseModel):
    """A set of near-identical works linked by flagged duplicate pairs (connected component)."""
    group_id: int
    work_count: int
    pair_count: int
    max_duplicate_score: float
    work_description: Optional[str] = None
    work_type: Optional[str] = None
    states: List[str] = []
    districts: List[str] = []
    mp_names: List[str] = []
    is_single_mp: bool
    total_sanctioned_amount: float
    first_sanction_date: Optional[str] = None
    last_sanction_date: Optional[str] = None
    sanction_span_days: Optional[int] = None
    reason: str
    works: List[WorkBrief] = []
    works_truncated: bool = False

class DuplicateSummaryResponse(BaseModel):
    total_pairs: int
    total_groups: int
    total_works_involved: int
    largest_group_size: int
