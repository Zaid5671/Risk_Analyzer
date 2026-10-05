from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel

T = TypeVar("T")

class WorkBrief(BaseModel):
    """Human-readable context for a work, attached to model results so lists can show what the work is."""
    work_id: str
    work_description: Optional[str] = None
    work_type: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    mp_name: Optional[str] = None
    work_status: Optional[str] = None
    sanction_amount: Optional[float] = None
    amount_disbursed: Optional[float] = None
    sanction_date: Optional[str] = None

class PaginationMeta(BaseModel):
    total_records: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    pagination: PaginationMeta

class HealthCheckResponse(BaseModel):
    status: str
    database: str
    db_latency_ms: float
    total_works: int
    version: str

class FilterOptionsResponse(BaseModel):
    states: List[str]
    districts: List[str]
    houses: List[str]
    work_categories: List[str]
    work_statuses: List[str]
    cost_severities: List[str]
    duplicate_severities: List[str]
    fund_severities: List[str]
    fund_audit_categories: List[str]
    delay_severities: List[str]
    delay_types: List[str]
