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
