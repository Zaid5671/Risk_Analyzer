export type DelaySeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
export type DelayType = 
  | 'RECOMMENDATION_TO_SANCTION_DELAY'
  | 'SANCTION_TO_COMPLETION_DELAY'
  | 'OPEN_WORK_AGING_STALLED';

export interface DelayItem {
  work_id: string;
  delay_score: number;
  severity: DelaySeverity;
  primary_delay_type: DelayType | null;
  active_delay_types: string[] | null;
  rec_to_sanc_days: number | null;
  rec_to_sanc_delay_days: number | null;
  rec_to_sanc_severity: string | null;
  sanc_to_comp_days: number | null;
  sanc_to_comp_delay_days: number | null;
  sanc_to_comp_severity: string | null;
  open_work_aging_days: number | null;
  open_work_overdue_days: number | null;
  open_work_aging_severity: string | null;
  explanation: string | null;
}

export interface DelayDetail extends DelayItem {
  state: string | null;
  district: string | null;
  mp_name: string | null;
  work_status: string | null;
  sanction_date: string | null;
  recommended_date: string | null;
  completion_date: string | null;
}
