import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { WorksRegistry } from '@/pages/WorksRegistry';
import { WorkDetail } from '@/pages/WorkDetail';
import { CostAnomalies } from '@/pages/CostAnomalies';
import { DuplicateWorks } from '@/pages/DuplicateWorks';
import { DuplicateComparison } from '@/pages/DuplicateComparison';
import { FundAnomalies } from '@/pages/FundAnomalies';
import { StatutoryDelays } from '@/pages/StatutoryDelays';
import { DistrictSummary } from '@/pages/DistrictSummary';
import { MPSummary } from '@/pages/MPSummary';
import { AdminUsers } from '@/pages/AdminUsers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes inside AppLayout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/works" element={<WorksRegistry />} />
                <Route path="/works/:workId" element={<WorkDetail />} />
                <Route path="/analytics/cost-anomalies" element={<CostAnomalies />} />
                <Route path="/analytics/duplicate-works" element={<DuplicateWorks />} />
                <Route path="/duplicates/compare" element={<DuplicateComparison />} />
                <Route path="/analytics/fund-anomalies" element={<FundAnomalies />} />
                <Route path="/analytics/delays" element={<StatutoryDelays />} />
                <Route path="/analytics/district-summary" element={<DistrictSummary />} />
                <Route path="/analytics/mp-summary" element={<MPSummary />} />

                {/* Ministry Admin Only */}
                <Route element={<ProtectedRoute allowedRoles={['MINISTRY']} />}>
                  <Route path="/admin/users" element={<AdminUsers />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
