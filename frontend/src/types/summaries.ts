export interface DistrictSummaryItem {
  state: string;
  district: string;
  total_works: number;
  total_sanctioned_amount: number;
  total_disbursed_amount: number;
  high_cost_anomalies: number;
  high_duplicate_pairs: number;
  high_fund_anomalies: number;
  high_delays: number;
}

export interface MPSummaryItem {
  mp_name: string;
  house: string;
  state: string;
  constituency: string | null;
  total_works: number;
  total_sanctioned_amount: number;
  completed_works: number;
  completion_rate: number;
  high_cost_anomalies: number;
  high_fund_anomalies: number;
  high_delays: number;
}
