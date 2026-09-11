from typing import Optional
from enum import Enum
from pydantic import BaseModel, ConfigDict

class DelayRiskSeverityEnum(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class DelayPredictionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    work_id: str
    predicted_completion_risk: float
    predicted_risk_severity: str
    days_since_sanction: Optional[int] = None
    current_utilization: Optional[float] = None
    explanation: Optional[str] = None

class DelayPredictionDetail(DelayPredictionItem):
    house: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    mp_name: Optional[str] = None
    work_category: Optional[str] = None
    work_type: Optional[str] = None
    sanction_amount: Optional[float] = None
    amount_disbursed: Optional[float] = None
    work_status: Optional[str] = None
