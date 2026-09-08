import type { CostAnomalyItem } from './cost_anomaly';
import type { DuplicatePairItem } from './duplicate_work';
import type { FundAnomalyItem } from './fund_anomaly';
import type { DelayItem } from './delay';

export interface WorkExpenditureItem {
  id: number;
  expenditure_date: string | null;
  vendor_name: string | null;
  fund_disbursed_amount: number | null;
  payment_status: string | null;
}

export interface WorkListItem {
  work_id: string;
  house: string | null;
  state: string | null;
  district: string | null;
  ida: string | null;
  mp_name: string | null;
  constituency: string | null;
  work_category: string | null;
  work_type: string | null;
  work_description: string | null;
  work_status: string | null;
  sanction_amount: number | null;
  sanction_date: string | null;
  recommended_date: string | null;
  completion_date: string | null;
  amount_disbursed: number | null;
  is_completed_flag: boolean | null;
}

export interface IndependentModelProfiles {
  cost_anomaly: CostAnomalyItem | null;
  duplicate_pairs: DuplicatePairItem[];
  fund_anomaly: FundAnomalyItem | null;
  delay: DelayItem | null;
}

export interface WorkDetail extends WorkListItem {
  expenditures: WorkExpenditureItem[];
  independent_risk_profiles: IndependentModelProfiles;
}
