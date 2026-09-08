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
}

export interface WorkDuplicateLookupResponse {
  work_id: string;
  total_flagged_pairs: number;
  pairs: DuplicatePairItem[];
}
