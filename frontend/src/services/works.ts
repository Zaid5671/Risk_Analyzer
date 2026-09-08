import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, FilterOptionsResponse } from '@/types/common';
import type { WorkListItem, WorkDetail } from '@/types/work';

export interface WorkQueryParams {
  page?: number;
  page_size?: number;
  state?: string;
  district?: string;
  mp_name?: string;
  work_category?: string;
  work_status?: string;
  min_sanction_amount?: number;
  max_sanction_amount?: number;
  search?: string;
}

export const worksService = {
  async getWorks(params?: WorkQueryParams): Promise<PaginatedResponse<WorkListItem>> {
    const { data } = await apiClient.get<PaginatedResponse<WorkListItem>>('/works', { params });
    return data;
  },

  async getWorkById(workId: string): Promise<WorkDetail> {
    const { data } = await apiClient.get<WorkDetail>('/works/' + encodeURIComponent(workId));
    return data;
  },

  async getFilters(): Promise<FilterOptionsResponse> {
    const { data } = await apiClient.get<FilterOptionsResponse>('/meta/filters');
    return data;
  },
};
