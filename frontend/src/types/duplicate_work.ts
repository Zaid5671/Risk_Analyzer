import type { WorkBrief } from './common';

export type DuplicateSeverity = 'HIGH' | 'REVIEW' | 'LOW';

export interface DuplicatePairItem {
  id: number;
  work_id_1: string;
  work_id_2: string;
  duplicate_score: number;
  severity: DuplicateSeverity;
  confidence: number | null;
  semantic_similarity: number | null;
  structural_score: number | null;
  amount_similarity: number | null;
  date_proximity: number | null;
  days_diff: number | null;
  is_same_mp: boolean | null;
  is_same_constituency: boolean | null;
  explanation: string | null;
  work_1?: WorkBrief | null;
  work_2?: WorkBrief | null;
}

export interface WorkDuplicateLookupResponse {
  work_id: string;
  total_flagged_pairs: number;
  pairs: DuplicatePairItem[];
}

/** Near-identical works linked by flagged pairs, as one group. */
export interface DuplicateGroupItem {
  group_id: number;
  work_count: number;
  pair_count: number;
  max_duplicate_score: number;
  work_description: string | null;
  work_type: string | null;
  states: string[];
  districts: string[];
  mp_names: string[];
  is_single_mp: boolean;
  total_sanctioned_amount: number;
  first_sanction_date: string | null;
  last_sanction_date: string | null;
  sanction_span_days: number | null;
  reason: string;
  works: WorkBrief[];
  works_truncated: boolean;
}

export interface DuplicateSummary {
  total_pairs: number;
  total_groups: number;
  total_works_involved: number;
  largest_group_size: number;
}
