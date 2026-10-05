import type { WorkBrief } from './common';

export interface DelayPredictionItem {
  work_id: string;
  predicted_completion_risk: number;
  predicted_risk_severity: 'HIGH' | 'MEDIUM' | 'LOW';
  days_since_sanction?: number | null;
  current_utilization?: number | null;
  explanation?: string | null;
  work_info?: WorkBrief | null;
  reason?: string | null;
}

export interface DelayPredictionDetail extends DelayPredictionItem {
  house?: string | null;
  state?: string | null;
  district?: string | null;
  mp_name?: string | null;
  work_category?: string | null;
  work_type?: string | null;
  sanction_amount?: number | null;
  amount_disbursed?: number | null;
  work_status?: string | null;
}
