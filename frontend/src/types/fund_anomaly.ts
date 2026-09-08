export type FundSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type FundAuditCategory = 
  | 'ACTIVE_EXPENDITURE'
  | 'NORMAL_AWAITING_DISBURSEMENT'
  | 'DORMANT_SANCTION'
  | 'STATUS_EXPENDITURE_MISMATCH';

export interface FundAnomalyItem {
  work_id: string;
  fund_anomaly_score: number;
  raw_score: number | null;
  severity: FundSeverity;
  audit_category: FundAuditCategory;
  total_disbursed_amount: number | null;
  utilization_ratio: number | null;
  transaction_count: number | null;
  payment_concentration_hhi: number | null;
  days_to_first_disbursement: number | null;
  anomaly_reasons: string[] | null;
  explanation: string | null;
}

export interface FundAnomalyDetail extends FundAnomalyItem {
  sanction_amount: number | null;
  work_status: string | null;
  state: string | null;
  district: string | null;
  mp_name: string | null;
}
