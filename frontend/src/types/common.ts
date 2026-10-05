/** Human-readable context the API attaches to model results (what the work is, where, how much). */
export interface WorkBrief {
  work_id: string;
  work_description: string | null;
  work_type: string | null;
  state: string | null;
  district: string | null;
  mp_name: string | null;
  work_status: string | null;
  sanction_amount: number | null;
  amount_disbursed: number | null;
  sanction_date: string | null;
}

export interface PaginationMeta {
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface HealthCheckResponse {
  status: string;
  database: string;
  db_latency_ms: number;
  total_works: number;
  version: string;
  /** Public demo: account management is read-only */
  demo_mode?: boolean;
}

export interface FilterOptionsResponse {
  states: string[];
  districts: string[];
  houses: string[];
  work_categories: string[];
  work_statuses: string[];
  cost_severities: string[];
  duplicate_severities: string[];
  fund_severities: string[];
  fund_audit_categories: string[];
  delay_severities: string[];
  delay_types: string[];
}
