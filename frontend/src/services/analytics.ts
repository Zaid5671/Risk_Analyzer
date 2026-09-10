import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse } from '@/types/common';
import type { CostAnomalyItem, CostAnomalyDetail } from '@/types/cost_anomaly';
import type { DuplicatePairItem, WorkDuplicateLookupResponse } from '@/types/duplicate_work';
import type { FundAnomalyItem, FundAnomalyDetail } from '@/types/fund_anomaly';
import type { DelayItem, DelayDetail } from '@/types/delay';
import type { DistrictSummaryItem, MPSummaryItem } from '@/types/summaries';

export const analyticsService = {
  // Model 1: Cost Anomalies
  async getCostAnomalies(params?: {
    severity?: string;
    min_score?: number;
    state?: string;
    district?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CostAnomalyItem>> {
    const { data } = await apiClient.get<PaginatedResponse<CostAnomalyItem>>('/analytics/cost-anomalies', { params });
    return data;
  },

  async getCostAnomalyById(workId: string): Promise<CostAnomalyDetail> {
    const { data } = await apiClient.get<CostAnomalyDetail>('/analytics/cost-anomalies/' + encodeURIComponent(workId));
    return data;
  },

  // Model 2: Duplicate Works
  async getDuplicateWorks(params?: {
    severity?: string;
    min_duplicate_score?: number;
    is_same_mp?: boolean;
    is_same_constituency?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<DuplicatePairItem>> {
    const { data } = await apiClient.get<PaginatedResponse<DuplicatePairItem>>('/analytics/duplicate-works', { params });
    return data;
  },

  async getDuplicatePairsForWork(workId: string): Promise<WorkDuplicateLookupResponse> {
    const { data } = await apiClient.get<WorkDuplicateLookupResponse>('/analytics/duplicate-works/pairs/' + encodeURIComponent(workId));
    return data;
  },

  // Model 3: Fund Anomalies
  async getFundAnomalies(params?: {
    severity?: string;
    audit_category?: string;
    min_score?: number;
    min_utilization?: number;
    max_utilization?: number;
    state?: string;
    district?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<FundAnomalyItem>> {
    const { data } = await apiClient.get<PaginatedResponse<FundAnomalyItem>>('/analytics/fund-anomalies', { params });
    return data;
  },

  async getFundAnomalyById(workId: string): Promise<FundAnomalyDetail> {
    const { data } = await apiClient.get<FundAnomalyDetail>('/analytics/fund-anomalies/' + encodeURIComponent(workId));
    return data;
  },

  // Model 4: Statutory Delays
  async getDelays(params?: {
    severity?: string;
    primary_delay_type?: string;
    min_days_overdue?: number;
    state?: string;
    district?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<DelayItem>> {
    const { data } = await apiClient.get<PaginatedResponse<DelayItem>>('/analytics/delays', { params });
    return data;
  },

  async getDelayById(workId: string): Promise<DelayDetail> {
    const { data } = await apiClient.get<DelayDetail>('/analytics/delays/' + encodeURIComponent(workId));
    return data;
  },

  // Summaries
  async getDistrictSummaries(params?: { state?: string; limit?: number }): Promise<DistrictSummaryItem[]> {
    const queryParams = { limit: 500, ...params };
    const { data } = await apiClient.get<DistrictSummaryItem[]>('/analytics/district-summary', { params: queryParams });
    return data;
  },

  async getMPSummaries(params?: { state?: string; house?: string; limit?: number; mp_name?: string }): Promise<MPSummaryItem[]> {
    const queryParams = { limit: 500, ...params };
    const { data } = await apiClient.get<MPSummaryItem[]>('/analytics/mp-summary', { params: queryParams });
    return data;
  },

  // Trend & Aggregate Analytics (Module 5)
  async getNationalTrends(): Promise<import('@/types/trends').NationalTrendsResponse> {
    const { data } = await apiClient.get<import('@/types/trends').NationalTrendsResponse>('/analytics/trends/national');
    return data;
  },

  async getStateTrends(params?: { state?: string }): Promise<import('@/types/trends').StateTrendsResponse> {
    const { data } = await apiClient.get<import('@/types/trends').StateTrendsResponse>('/analytics/trends/state', { params });
    return data;
  },

  async getDistrictTrends(params?: { state?: string; district?: string }): Promise<import('@/types/trends').DistrictTrendsResponse> {
    const { data } = await apiClient.get<import('@/types/trends').DistrictTrendsResponse>('/analytics/trends/district', { params });
    return data;
  },

  async getMPTrends(params?: { mp_name?: string }): Promise<import('@/types/trends').MPTrendsResponse> {
    const { data } = await apiClient.get<import('@/types/trends').MPTrendsResponse>('/analytics/trends/mp', { params });
    return data;
  },

  async getEarlyWarnings(params?: {
    urgency_level?: string;
    warning_type?: string;
    state?: string;
    district?: string;
    mp_name?: string;
    limit?: number;
  }): Promise<import('@/types/trends').EarlyWarningsResponse> {
    const { data } = await apiClient.get<import('@/types/trends').EarlyWarningsResponse>('/analytics/trends/early-warnings', { params });
    return data;
  }
};
