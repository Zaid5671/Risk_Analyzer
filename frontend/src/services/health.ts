import { apiClient } from '@/lib/api-client';
import type { HealthCheckResponse } from '@/types/common';

export const healthService = {
  async getHealth(): Promise<HealthCheckResponse> {
    const { data } = await apiClient.get<HealthCheckResponse>('/health');
    return data;
  },
};
