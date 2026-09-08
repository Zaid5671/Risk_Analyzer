export type CostSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'DATA_QUALITY_EXCEPTION' | 'INSUFFICIENT_PEER_DATA';

export interface CostAnomalyItem {
  work_id: string;
  cost_anomaly_score: number;
  raw_anomaly_score: number | null;
  severity: CostSeverity;
  peer_group_used: string | null;
  peer_group_level: string | null;
  peer_group_size: number | null;
  is_data_quality_exception: boolean;
  explanation: string | null;
}

export interface CostAnomalyDetail extends CostAnomalyItem {
  house: string | null;
  state: string | null;
  district: string | null;
  mp_name: string | null;
  work_type: string | null;
  sanction_amount: number | null;
}
