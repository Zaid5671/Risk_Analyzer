// TypeScript interfaces for Trend & Aggregate Analytics (SIH PS 26102)

export type CredibilityTier = 'ROBUST' | 'MODERATE' | 'LOW_VOLUME' | 'INSUFFICIENT';

export type Trajectory =
  | 'IMPROVING'
  | 'STABLE'
  | 'DETERIORATING'
  | 'SUSTAINED_INCREASE'
  | 'INSUFFICIENT_HISTORY';

export type WarningType =
  | 'SLA_NEAR_MISS'
  | 'SLA_SANCTION_CLIFF'
  | 'APPROACHING_DORMANCY'
  | 'STAGNATION_INCUBATION'
  | 'BATCH_DUPLICATE_CLUSTER';

export type UrgencyLevel = 'WATCHLIST' | 'CRITICAL';

export interface QuarterTrendItem {
  year_quarter: string;
  quarter_start_date: string;
  total_sanctioned_works: number;
  total_sanctioned_amount: number;
  total_disbursed_amount: number;
  credibility_tier: CredibilityTier;

  // Cost Anomaly (Module 1)
  high_cost_works_count: number;
  cost_anomaly_rate: number | null;
  excess_sanctioned_amount_inr: number;
  cost_trajectory: Trajectory;

  // Duplicate Works (Module 2 - Work-grain de-duplicated)
  unique_duplicate_works_count: number;
  duplicate_work_rate: number | null;
  duplicate_cluster_density: number;
  duplicate_exposure_inr: number;

  // Fund & Expenditure Anomaly (Module 3)
  high_fund_works_count: number;
  fund_anomaly_rate: number | null;
  status_mismatch_count: number;
  dormant_sanction_count: number;
  fund_trajectory: Trajectory;

  // Statutory Delay & SLA (Module 4)
  sanction_sla_compliant_count: number;
  sanction_sla_compliance_rate: number | null;
  mean_rec_to_sanc_delay_days: number;
  high_delay_works_count: number;
  delay_rate: number | null;
  delay_trajectory: Trajectory;
}

export interface NationalTrendsResponse {
  summary: {
    total_canonical_works: number;
    latest_quarter: string;
    latest_cost_anomaly_rate: number | null;
    latest_delay_rate: number | null;
    latest_fund_anomaly_rate: number | null;
    latest_duplicate_work_rate: number | null;
    statutory_mandate: string;
    [key: string]: any;
  };
  quarterly_trends: QuarterTrendItem[];
}

export interface StateTrendItem {
  state: string;
  year_quarter: string;
  total_sanctioned_works: number;
  total_sanctioned_amount: number;
  total_disbursed_amount: number;
  credibility_tier: CredibilityTier;
  cost_anomaly_rate: number | null;
  cost_anomaly_rate_smoothed: number | null;
  duplicate_work_rate: number | null;
  fund_anomaly_rate: number | null;
  delay_rate: number | null;
  sanction_sla_compliance_rate: number | null;
  cost_trajectory: Trajectory;
  delay_trajectory: Trajectory;
  fund_trajectory: Trajectory;
}

export interface StateTrendsResponse {
  state?: string;
  national_benchmark_quarter: {
    benchmark_quarter: string;
    national_cost_rate: number;
    national_delay_rate: number;
    national_fund_rate: number;
    national_sla_rate: number;
  };
  trends: StateTrendItem[];
}

export interface DistrictTrendItem {
  state: string;
  district: string;
  year_quarter: string;
  total_sanctioned_works: number;
  total_sanctioned_amount: number;
  total_disbursed_amount: number;
  credibility_tier: CredibilityTier;
  cost_anomaly_rate: number | null;
  cost_anomaly_rate_smoothed: number | null;
  duplicate_work_rate: number | null;
  fund_anomaly_rate: number | null;
  delay_rate: number | null;
  sanction_sla_compliance_rate: number | null;
  cost_trajectory: Trajectory;
  delay_trajectory: Trajectory;
  fund_trajectory: Trajectory;
}

export interface DistrictTrendsResponse {
  state: string;
  district: string;
  credibility_tier: CredibilityTier;
  trends: DistrictTrendItem[];
  state_peer_benchmark: {
    state?: string;
    benchmark_quarter?: string;
    state_cost_rate?: number | null;
    state_delay_rate?: number | null;
    state_sla_rate?: number | null;
    [key: string]: any;
  };
}

export interface MPTrendItem {
  mp_name: string;
  house?: string;
  fiscal_year_or_quarter: string;
  total_sanctioned_works: number;
  total_sanctioned_amount: number;
  total_disbursed_amount: number;
  credibility_tier: CredibilityTier;
  cost_anomaly_rate: number | null;
  duplicate_work_rate: number | null;
  fund_anomaly_rate: number | null;
  delay_rate: number | null;
  sanction_sla_compliance_rate: number | null;
}

export interface MPTrendsResponse {
  mp_name: string;
  house?: string;
  tenure_summary: {
    mp_name: string;
    house: string;
    tenure_total_works: number;
    tenure_sanctioned_amount: number;
    tenure_disbursed_amount: number;
    utilization_efficiency: number;
    [key: string]: any;
  };
  trends: MPTrendItem[];
  house_benchmark: {
    house?: string;
    benchmark_note?: string;
    [key: string]: any;
  };
}

export interface EarlyWarningItem {
  work_id: string;
  state: string;
  district: string;
  mp_name: string | null;
  sanction_amount: number;
  work_type_template: string | null;
  warning_type: WarningType;
  paradigm: 'STATUTORY' | 'STATISTICAL';
  days_elapsed: number;
  days_to_statutory_breach: number | null;
  urgency_level: UrgencyLevel;
  action_recommended: string;
}

export interface EarlyWarningsResponse {
  total_alerts: number;
  watchlist_count: number;
  critical_count: number;
  alerts: EarlyWarningItem[];
}
