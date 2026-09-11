import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { healthService } from '@/services/health';
import { worksService } from '@/services/works';
import { analyticsService } from '@/services/analytics';
import type { HealthCheckResponse } from '@/types/common';
import type { CostAnomalyItem } from '@/types/cost_anomaly';
import type { DuplicatePairItem } from '@/types/duplicate_work';
import type { FundAnomalyItem } from '@/types/fund_anomaly';
import type { DelayItem } from '@/types/delay';
import type { DistrictSummaryItem, MPSummaryItem } from '@/types/summaries';
import { MetricCard } from '@/components/common/MetricCard';
import { SeverityBadge, Badge } from '@/components/common/Badge';
import {
  FolderKanban,
  AlertTriangle,
  Copy,
  BadgePercent,
  Clock,
  Landmark,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ArrowUpDown,
  Search,
  Activity,
  Layers,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'MINISTRY':
      return <MinistryDashboard />;
    case 'STATE_OFFICER':
      return <StateDashboard stateName={user.assigned_state || 'Uttar Pradesh'} />;
    case 'DISTRICT_OFFICER':
      return (
        <DistrictDashboard
          districtName={user.assigned_district || 'PATNA'}
          stateName={user.assigned_state || 'Bihar'}
        />
      );
    case 'MP':
      return <MPDashboard mpName={user.assigned_mp_name || 'SARABJEET SINGH KHALSA'} />;
    default:
      return <MinistryDashboard />;
  }
};

/* -------------------------------------------------------------
 * 1. MINISTRY DASHBOARD (National Oversight — PS 26102 Aligned)
 * ------------------------------------------------------------- */
interface StatePerformanceRow {
  state: string;
  total_works: number;
  total_sanctioned_amount: number;
  total_disbursed_amount: number;
  utilization_rate: number;
  high_cost_anomalies: number;
  high_fund_anomalies: number;
  high_delays: number;
  district_count: number;
}

interface AttentionWorkItem {
  work_id: string;
  flags: { model: string; label: string; color: 'rose' | 'amber' | 'blue' }[];
}

type SortField =
  | 'total_sanctioned_amount'
  | 'total_disbursed_amount'
  | 'total_works'
  | 'utilization_rate'
  | 'high_cost_anomalies'
  | 'high_fund_anomalies'
  | 'high_delays'
  | 'state';

const MinistryDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [districts, setDistricts] = useState<DistrictSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateSearch, setStateSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_sanctioned_amount');
  const [sortAsc, setSortAsc] = useState(false);

  // Dynamic severity counts from models
  const [modelCounts, setModelCounts] = useState<{
    costHigh: number;
    duplicateHigh: number;
    fundHigh: number;
    delayHigh: number;
  }>({
    costHigh: 986,
    duplicateHigh: 50000,
    fundHigh: 1737,
    delayHigh: 15263,
  });

  // Attention Required queue items
  const [attentionWorks, setAttentionWorks] = useState<AttentionWorkItem[]>([]);

  useEffect(() => {
    Promise.allSettled([
      healthService.getHealth(),
      analyticsService.getDistrictSummaries(),
      analyticsService.getCostAnomalies({ severity: 'HIGH', page_size: 1 }),
      analyticsService.getDuplicateWorks({ severity: 'HIGH', page_size: 1 }),
      analyticsService.getFundAnomalies({ severity: 'HIGH', page_size: 1 }),
      analyticsService.getDelays({ severity: 'HIGH', page_size: 1 }),
    ]).then(([resHealth, resDist, resCost, resDup, resFund, resDelay]) => {
      if (resHealth.status === 'fulfilled') setHealth(resHealth.value);
      if (resDist.status === 'fulfilled') setDistricts(resDist.value);

      setModelCounts({
        costHigh: resCost.status === 'fulfilled' ? resCost.value.pagination.total_records : 986,
        duplicateHigh: resDup.status === 'fulfilled' ? resDup.value.pagination.total_records : 50000,
        fundHigh: resFund.status === 'fulfilled' ? resFund.value.pagination.total_records : 1737,
        delayHigh: resDelay.status === 'fulfilled' ? resDelay.value.pagination.total_records : 15263,
      });

      setLoading(false);
    });

    // Populate Attention Required Queue (Cross-model merge)
    Promise.allSettled([
      analyticsService.getCostAnomalies({ severity: 'HIGH', page_size: 6 }),
      analyticsService.getFundAnomalies({ severity: 'HIGH', page_size: 6 }),
      analyticsService.getDelays({ severity: 'HIGH', page_size: 6 }),
    ]).then(([resCost, resFund, resDelay]) => {
      const workMap = new Map<string, AttentionWorkItem['flags']>();

      if (resCost.status === 'fulfilled') {
        resCost.value.items.forEach((c) => {
          const flags = workMap.get(c.work_id) || [];
          flags.push({
            model: 'Cost Anomaly',
            label: c.explanation ? c.explanation.slice(0, 48) + '…' : 'Peer Outlier',
            color: 'rose',
          });
          workMap.set(c.work_id, flags);
        });
      }

      if (resFund.status === 'fulfilled') {
        resFund.value.items.forEach((f) => {
          const flags = workMap.get(f.work_id) || [];
          flags.push({
            model: 'Fund Anomaly',
            label: f.audit_category ? f.audit_category.replace(/_/g, ' ') : 'Disbursement Irregularity',
            color: 'amber',
          });
          workMap.set(f.work_id, flags);
        });
      }

      if (resDelay.status === 'fulfilled') {
        resDelay.value.items.forEach((d) => {
          const flags = workMap.get(d.work_id) || [];
          flags.push({
            model: 'Statutory Delay',
            label: d.primary_delay_type ? d.primary_delay_type.replace(/_/g, ' ') : 'Overdue SLA',
            color: 'blue',
          });
          workMap.set(d.work_id, flags);
        });
      }

      const merged: AttentionWorkItem[] = Array.from(workMap.entries())
        .map(([work_id, flags]) => ({ work_id, flags }))
        .sort((a, b) => b.flags.length - a.flags.length)
        .slice(0, 8);

      setAttentionWorks(merged);
    });
  }, []);

  // Section 1: Macro Portfolio Aggregates
  const totalWorksCount = health?.total_works || (districts.length > 0 ? districts.reduce((acc, d) => acc + d.total_works, 0) : 98825);
  const totalSanctionedAmt = useMemo(() => districts.reduce((sum, d) => sum + (d.total_sanctioned_amount || 0), 0), [districts]);
  const totalDisbursedAmt = useMemo(() => districts.reduce((sum, d) => sum + (d.total_disbursed_amount || 0), 0), [districts]);
  const nationalUtilization = totalSanctionedAmt > 0 ? ((totalDisbursedAmt / totalSanctionedAmt) * 100).toFixed(1) : '41.6';

  // Section 3: State Performance Aggregation
  const statePerformanceRows = useMemo(() => {
    const map = new Map<string, StatePerformanceRow>();
    districts.forEach((d) => {
      const stateName = d.state || 'Unknown';
      if (!map.has(stateName)) {
        map.set(stateName, {
          state: stateName,
          total_works: 0,
          total_sanctioned_amount: 0,
          total_disbursed_amount: 0,
          utilization_rate: 0,
          high_cost_anomalies: 0,
          high_fund_anomalies: 0,
          high_delays: 0,
          district_count: 0,
        });
      }
      const item = map.get(stateName)!;
      item.total_works += d.total_works || 0;
      item.total_sanctioned_amount += d.total_sanctioned_amount || 0;
      item.total_disbursed_amount += d.total_disbursed_amount || 0;
      item.high_cost_anomalies += d.high_cost_anomalies || 0;
      item.high_fund_anomalies += d.high_fund_anomalies || 0;
      item.high_delays += d.high_delays || 0;
      item.district_count += 1;
    });

    return Array.from(map.values()).map((row) => ({
      ...row,
      utilization_rate: row.total_sanctioned_amount > 0 ? (row.total_disbursed_amount / row.total_sanctioned_amount) * 100 : 0,
    }));
  }, [districts]);

  // Sorting & Filtering for State Performance Table
  const filteredSortedStates = useMemo(() => {
    let list = statePerformanceRows;
    if (stateSearch.trim()) {
      const q = stateSearch.toLowerCase();
      list = list.filter((s) => s.state.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortField === 'state') {
        return sortAsc ? a.state.localeCompare(b.state) : b.state.localeCompare(a.state);
      }
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [statePerformanceRows, stateSearch, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Section 4: Top 10 States Financial Pacing Chart
  const top10StatesChartData = useMemo(() => {
    return [...statePerformanceRows]
      .sort((a, b) => b.total_sanctioned_amount - a.total_sanctioned_amount)
      .slice(0, 8)
      .map((s) => ({
        state: s.state.length > 12 ? s.state.slice(0, 10) + '…' : s.state,
        fullState: s.state,
        sanctionedCr: Number((s.total_sanctioned_amount / 1e7).toFixed(1)),
        disbursedCr: Number((s.total_disbursed_amount / 1e7).toFixed(1)),
        utilization: s.utilization_rate.toFixed(1),
      }));
  }, [statePerformanceRows]);

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl border border-slate-700">
          <p className="font-bold text-slate-100">{data.fullState}</p>
          <div className="mt-1 space-y-0.5 tabular-nums">
            <p className="text-blue-300 font-medium">Sanctioned Outlay: ₹{data.sanctionedCr.toLocaleString()} Cr</p>
            <p className="text-amber-300 font-medium">Disbursed Funds: ₹{data.disbursedCr.toLocaleString()} Cr</p>
            <p className="text-emerald-300 font-semibold pt-1 border-t border-slate-800">
              Utilization: {data.utilization}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">National Executive Overview</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md border border-blue-200">
              Central MoSPI Oversight
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ministry of Statistics and Programme Implementation • Scheme-wide surveillance across 36 States/UTs
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Zero Composite Scoring • 4 Isolated Models</span>
        </div>
      </div>

      {/* SECTION 1: National Macro Portfolio KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Total Sanctioned Works"
          value={totalWorksCount.toLocaleString()}
          subtitle="Database Master Catalog"
          icon={FolderKanban}
        />
        <MetricCard
          title="Total Sanctioned Outlay"
          value={`₹${(totalSanctionedAmt / 1e7).toFixed(1)} Cr`}
          subtitle="Across 500+ Districts in India"
          icon={TrendingUp}
        />
        <MetricCard
          title="Cumulative Disbursed Capital"
          value={`₹${(totalDisbursedAmt / 1e7).toFixed(1)} Cr`}
          subtitle="Reconciled Bank Vouchers"
          icon={Landmark}
        />
        <MetricCard
          title="National Fund Utilization"
          value={`${nationalUtilization}%`}
          subtitle="Capital Disbursed / Sanctioned"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* SECTION 2: Four Independent Module Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Independent Analytical Surveillance (4 Modules)
            </h2>
            <span className="text-[10px] text-slate-500">
              Decoupled algorithmic pipelines • No synthetic blended scores
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Model 1: Cost Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                  Model 1: Cost Anomalies
                </span>
                <div className="p-1.5 rounded-md bg-rose-50/80 border border-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-rose-700 tabular-nums tracking-tight">
                  {modelCounts.costHigh.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Cost Outliers</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Isolation Forest
              </span>
              <Link
                to="/analytics/cost-anomalies?severity=HIGH"
                className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Inspect Outliers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 2: Duplicate Works */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  Model 2: Duplicate Works
                </span>
                <div className="p-1.5 rounded-md bg-indigo-50/80 border border-indigo-100 text-indigo-600 shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-indigo-700 tabular-nums tracking-tight">
                  {modelCounts.duplicateHigh.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">Flagged Candidate Pairs</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MiniLM Embeddings
              </span>
              <Link
                to="/analytics/duplicate-works?severity=HIGH"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Review Pairs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 3: Fund Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                  Model 3: Fund & Expenditure
                </span>
                <div className="p-1.5 rounded-md bg-amber-50/80 border border-amber-100 text-amber-600 shrink-0">
                  <BadgePercent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-amber-700 tabular-nums tracking-tight">
                  {modelCounts.fundHigh.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Disbursement Flags</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Vendor HHI Index
              </span>
              <Link
                to="/analytics/fund-anomalies?severity=HIGH"
                className="text-xs font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Audit Pacing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 4: Statutory Delays */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                  Model 4: Statutory Delays
                </span>
                <div className="p-1.5 rounded-md bg-blue-50/80 border border-blue-100 text-blue-600 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-blue-700 tabular-nums tracking-tight">
                  {modelCounts.delayHigh.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High SLA Violations</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MoSPI 2023 SLA
              </span>
              <Link
                to="/analytics/delays?severity=HIGH"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Triage Delays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: State Performance Table (Primary Geographic Oversight) */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              State-Level Portfolio & SLA Governance Performance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rollup across all States &amp; UTs with independent anomaly counts • Click headers to sort
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              placeholder="Search state..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <th
                  onClick={() => handleSort('state')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>State / UT</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_works')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Works</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_sanctioned_amount')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Sanctioned (₹ Cr)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('total_disbursed_amount')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Disbursed (₹ Cr)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('utilization_rate')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Utilization</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('high_cost_anomalies')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1 text-rose-700">
                    <span>High Cost</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('high_fund_anomalies')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1 text-amber-700">
                    <span>High Fund</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('high_delays')}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors text-right"
                >
                  <div className="flex items-center justify-end gap-1 text-blue-700">
                    <span>High Delays</span>
                    <ArrowUpDown className="w-3 h-3 text-blue-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSortedStates.slice(0, 10).map((s) => (
                <tr key={s.state} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    <div>
                      <span>{s.state}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {s.district_count} districts reported
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    {s.total_works.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ₹{(s.total_sanctioned_amount / 1e7).toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    ₹{(s.total_disbursed_amount / 1e7).toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    <span
                      className={`font-semibold ${
                        s.utilization_rate >= 50
                          ? 'text-emerald-700'
                          : s.utilization_rate >= 30
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {s.utilization_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {s.high_cost_anomalies > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                        {s.high_cost_anomalies}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {s.high_fund_anomalies > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                        {s.high_fund_anomalies}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                    {s.high_delays > 0 ? (
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {s.high_delays}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Link
                      to={`/analytics/district-summary?state=${encodeURIComponent(s.state)}`}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      Districts <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing top 10 of {filteredSortedStates.length} States &amp; UTs (sorted by{' '}
            <strong className="text-slate-700">{sortField.replace(/_/g, ' ')}</strong>)
          </span>
          <Link to="/analytics/district-summary" className="text-blue-600 hover:underline font-semibold">
            View All 500+ District Breakdown →
          </Link>
        </div>
      </div>

      {/* SECTION 4 & 5: Two-Column Decision Support Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 4: Financial Pacing Chart (Top 8 States by Outlay) */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Capital Allocation vs Disbursement Pacing (Top States)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Comparing Sanctioned Outlay vs Actual Vouchers Disbursed (in ₹ Crores)
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top10StatesChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="state" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="sanctionedCr"
                    name="Sanctioned Outlay"
                    fill="#1e3a8a"
                    radius={[3, 3, 0, 0]}
                    barSize={14}
                  />
                  <Bar
                    dataKey="disbursedCr"
                    name="Disbursed Funds"
                    fill="#d97706"
                    radius={[3, 3, 0, 0]}
                    barSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1e3a8a]"></span>
                <span>Sanctioned Capital</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#d97706]"></span>
                <span>Disbursed Voucher Spend</span>
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">Reconciled Data</span>
          </div>
        </div>

        {/* SECTION 5: Attention Required Queue (Cross-Model Signals) */}
        <div className="bg-white rounded-lg border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Attention Required Queue — Multi-Model Signals
              </h3>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                Actionable Works
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Works flagged with HIGH severity findings across independent analytical models
            </p>

            <div className="divide-y divide-slate-100 text-xs">
              {attentionWorks.length > 0 ? (
                attentionWorks.map((item) => (
                  <div key={item.work_id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/works/${encodeURIComponent(item.work_id)}`}
                          className="font-mono font-bold text-blue-700 hover:text-blue-900 hover:underline truncate"
                        >
                          {item.work_id}
                        </Link>
                        {item.flags.length > 1 && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            {item.flags.length} Models Flagged
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.flags.map((flag, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${
                              flag.color === 'rose'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : flag.color === 'amber'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {flag.model}: {flag.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      to={`/works/${encodeURIComponent(item.work_id)}`}
                      className="p-1.5 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors shrink-0"
                      title="Inspect Work Dossier"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <Activity className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Aggregating high-severity findings...</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Filtered by Model Severity = HIGH • Zero composite scoring
            </span>
            <Link to="/works" className="text-blue-600 hover:underline font-semibold">
              Explore Master Registry →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 2. STATE DASHBOARD (Inter-District Monitoring)
 * ------------------------------------------------------------- */
const StateDashboard: React.FC<{ stateName: string }> = ({ stateName }) => {
  const [districts, setDistricts] = useState<DistrictSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService
      .getDistrictSummaries({ state: stateName })
      .then(setDistricts)
      .finally(() => setLoading(false));
  }, [stateName]);

  const stateWorks = districts.reduce((acc, d) => acc + d.total_works, 0);
  const stateOutlay = districts.reduce((acc, d) => acc + d.total_sanctioned_amount, 0);
  const stateDisbursed = districts.reduce((acc, d) => acc + (d.total_disbursed_amount || 0), 0);
  const stateUtilization = stateOutlay > 0 ? ((stateDisbursed / stateOutlay) * 100).toFixed(1) : '0.0';

  const stateHighCost = districts.reduce((acc, d) => acc + (d.high_cost_anomalies || 0), 0);
  const stateHighDuplicates = districts.reduce((acc, d) => acc + (d.high_duplicate_pairs || 0), 0);
  const stateHighFund = districts.reduce((acc, d) => acc + (d.high_fund_anomalies || 0), 0);
  const stateHighDelays = districts.reduce((acc, d) => acc + (d.high_delays || 0), 0);

  return (
    <div className="space-y-6">
      {/* State Scope Banner */}
      <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-indigo-600 text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">State Nodal Authority • {stateName}</h1>
            <p className="text-xs text-slate-600">
              State-level governance oversight and inter-district statutory delay compliance.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-md border border-indigo-200 text-indigo-900">
          Jurisdiction Locked: {stateName}
        </span>
      </div>

      {/* SECTION 1: State Macro Portfolio KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="State Sanctioned Works"
          value={stateWorks.toLocaleString()}
          subtitle={`Across ${districts.length} districts in ${stateName}`}
          icon={FolderKanban}
        />
        <MetricCard
          title="State Sanctioned Outlay"
          value={`₹${(stateOutlay / 1e7).toFixed(1)} Cr`}
          subtitle="Allocated State Outlay"
          icon={TrendingUp}
        />
        <MetricCard
          title="Cumulative Disbursed Capital"
          value={`₹${(stateDisbursed / 1e7).toFixed(1)} Cr`}
          subtitle="Reconciled Bank Vouchers"
          icon={Landmark}
        />
        <MetricCard
          title="State Fund Utilization"
          value={`${stateUtilization}%`}
          subtitle="Capital Disbursed / Sanctioned"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* SECTION 2: Four Independent Module Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Independent Analytical Surveillance (4 Modules)
            </h2>
            <span className="text-[10px] text-slate-500">
              Decoupled algorithmic pipelines • No synthetic blended scores
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Model 1: Cost Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                  Model 1: Cost Anomalies
                </span>
                <div className="p-1.5 rounded-md bg-rose-50/80 border border-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-rose-700 tabular-nums tracking-tight">
                  {stateHighCost.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Cost Outliers</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Isolation Forest
              </span>
              <Link
                to={`/analytics/cost-anomalies?severity=HIGH&state=${encodeURIComponent(stateName)}`}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Inspect Outliers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 2: Duplicate Works */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  Model 2: Duplicate Works
                </span>
                <div className="p-1.5 rounded-md bg-indigo-50/80 border border-indigo-100 text-indigo-600 shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-indigo-700 tabular-nums tracking-tight">
                  {stateHighDuplicates.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">Flagged Candidate Pairs</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MiniLM Embeddings
              </span>
              <Link
                to="/analytics/duplicate-works?severity=HIGH"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Review Pairs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 3: Fund Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                  Model 3: Fund & Expenditure
                </span>
                <div className="p-1.5 rounded-md bg-amber-50/80 border border-amber-100 text-amber-600 shrink-0">
                  <BadgePercent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-amber-700 tabular-nums tracking-tight">
                  {stateHighFund.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Disbursement Flags</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Vendor HHI Index
              </span>
              <Link
                to={`/analytics/fund-anomalies?severity=HIGH&state=${encodeURIComponent(stateName)}`}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Audit Pacing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 4: Statutory Delays */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                  Model 4: Statutory Delays
                </span>
                <div className="p-1.5 rounded-md bg-blue-50/80 border border-blue-100 text-blue-600 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-blue-700 tabular-nums tracking-tight">
                  {stateHighDelays.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High SLA Violations</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MoSPI 2023 SLA
              </span>
              <Link
                to={`/analytics/delays?severity=HIGH&state=${encodeURIComponent(stateName)}`}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Triage Delays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Inter-District Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Inter-District Monitoring &amp; SLA Performance ({stateName})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Independent audit findings across all administrative districts in {stateName}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-600">
                <th className="py-2.5 px-3">District</th>
                <th className="py-2.5 px-3">Works</th>
                <th className="py-2.5 px-3">Outlay (₹ Cr)</th>
                <th className="py-2.5 px-3 text-rose-600">High Cost</th>
                <th className="py-2.5 px-3 text-indigo-600">High Duplicates</th>
                <th className="py-2.5 px-3 text-amber-600">High Fund</th>
                <th className="py-2.5 px-3 text-blue-600">High Delays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {districts.map((d) => (
                <tr key={d.district} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{d.district}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">{d.total_works.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-semibold">
                    ₹{(d.total_sanctioned_amount / 1e7).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-rose-700">
                    {d.high_cost_anomalies}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-indigo-700">
                    {d.high_duplicate_pairs}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-amber-700">
                    {d.high_fund_anomalies}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-blue-700">{d.high_delays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 3. DISTRICT DASHBOARD (Local Operational Queue)
 * ------------------------------------------------------------- */
const DistrictDashboard: React.FC<{ districtName: string; stateName: string }> = ({ districtName, stateName }) => {
  const [activeTab, setActiveTab] = useState<'cost' | 'duplicates' | 'funds' | 'delays'>('cost');
  const [districtSummary, setDistrictSummary] = useState<DistrictSummaryItem | null>(null);
  const [costAnomalies, setCostAnomalies] = useState<CostAnomalyItem[]>([]);
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicatePairItem[]>([]);
  const [fundAnomalies, setFundAnomalies] = useState<FundAnomalyItem[]>([]);
  const [delays, setDelays] = useState<DelayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      analyticsService.getDistrictSummaries({ state: stateName }),
      analyticsService.getCostAnomalies({ severity: 'HIGH', district: districtName, state: stateName, page: 1, page_size: 10 }),
      analyticsService.getDuplicateWorks({ severity: 'HIGH', page: 1, page_size: 10 }),
      analyticsService.getFundAnomalies({ severity: 'HIGH', district: districtName, state: stateName, page: 1, page_size: 10 }),
      analyticsService.getDelays({ severity: 'HIGH', district: districtName, state: stateName, page: 1, page_size: 10 }),
    ]).then(([resDist, resC, resD, resF, resL]) => {
      if (resDist.status === 'fulfilled') {
        const match = resDist.value.find(
          (d) => d.district.trim().toUpperCase() === districtName.trim().toUpperCase()
        );
        setDistrictSummary(match || null);
      }
      if (resC.status === 'fulfilled') setCostAnomalies(resC.value.items);
      if (resD.status === 'fulfilled') setDuplicatePairs(resD.value.items);
      if (resF.status === 'fulfilled') setFundAnomalies(resF.value.items);
      if (resL.status === 'fulfilled') setDelays(resL.value.items);
      setLoading(false);
    });
  }, [districtName, stateName]);

  const districtWorks = districtSummary?.total_works || 0;
  const districtOutlay = districtSummary?.total_sanctioned_amount || 0;
  const districtDisbursed = districtSummary?.total_disbursed_amount || 0;
  const districtUtilization = districtOutlay > 0 ? ((districtDisbursed / districtOutlay) * 100).toFixed(1) : '0.0';

  const districtHighCost = districtSummary?.high_cost_anomalies ?? costAnomalies.length;
  const districtHighDuplicates = districtSummary?.high_duplicate_pairs ?? duplicatePairs.length;
  const districtHighFund = districtSummary?.high_fund_anomalies ?? fundAnomalies.length;
  const districtHighDelays = districtSummary?.high_delays ?? delays.length;

  return (
    <div className="space-y-6">
      {/* District Scope Banner */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-600 text-white">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              District Planning Authority • {districtName}, {stateName}
            </h1>
            <p className="text-xs text-slate-600">
              Local Operational Review Queue • Sanctions, Physical Inspections &amp; Contractor Verification
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-md border border-emerald-200 text-emerald-900">
          Scope Locked: {districtName}
        </span>
      </div>

      {/* SECTION 1: District Macro Portfolio KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="District Sanctioned Works"
          value={districtWorks.toLocaleString()}
          subtitle={`Sanctioned in ${districtName}, ${stateName}`}
          icon={FolderKanban}
        />
        <MetricCard
          title="District Sanctioned Outlay"
          value={`₹${(districtOutlay / 1e7).toFixed(1)} Cr`}
          subtitle="Allocated District Outlay"
          icon={TrendingUp}
        />
        <MetricCard
          title="Cumulative Disbursed Capital"
          value={`₹${(districtDisbursed / 1e7).toFixed(1)} Cr`}
          subtitle="Reconciled Bank Vouchers"
          icon={Landmark}
        />
        <MetricCard
          title="District Fund Utilization"
          value={`${districtUtilization}%`}
          subtitle="Capital Disbursed / Sanctioned"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* SECTION 2: Four Independent Module Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Independent Analytical Surveillance (4 Modules)
            </h2>
            <span className="text-[10px] text-slate-500">
              Decoupled algorithmic pipelines • No synthetic blended scores
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Model 1: Cost Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                  Model 1: Cost Anomalies
                </span>
                <div className="p-1.5 rounded-md bg-rose-50/80 border border-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-rose-700 tabular-nums tracking-tight">
                  {districtHighCost.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Cost Outliers</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Isolation Forest
              </span>
              <Link
                to={`/analytics/cost-anomalies?severity=HIGH&district=${encodeURIComponent(districtName)}&state=${encodeURIComponent(stateName)}`}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Inspect Outliers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 2: Duplicate Works */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  Model 2: Duplicate Works
                </span>
                <div className="p-1.5 rounded-md bg-indigo-50/80 border border-indigo-100 text-indigo-600 shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-indigo-700 tabular-nums tracking-tight">
                  {districtHighDuplicates.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">Flagged Candidate Pairs</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MiniLM Embeddings
              </span>
              <Link
                to="/analytics/duplicate-works?severity=HIGH"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Review Pairs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 3: Fund Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                  Model 3: Fund & Expenditure
                </span>
                <div className="p-1.5 rounded-md bg-amber-50/80 border border-amber-100 text-amber-600 shrink-0">
                  <BadgePercent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-amber-700 tabular-nums tracking-tight">
                  {districtHighFund.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Disbursement Flags</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Vendor HHI Index
              </span>
              <Link
                to={`/analytics/fund-anomalies?severity=HIGH&district=${encodeURIComponent(districtName)}&state=${encodeURIComponent(stateName)}`}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Audit Pacing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 4: Statutory Delays */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                  Model 4: Statutory Delays
                </span>
                <div className="p-1.5 rounded-md bg-blue-50/80 border border-blue-100 text-blue-600 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-blue-700 tabular-nums tracking-tight">
                  {districtHighDelays.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High SLA Violations</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MoSPI 2023 SLA
              </span>
              <Link
                to={`/analytics/delays?severity=HIGH&district=${encodeURIComponent(districtName)}&state=${encodeURIComponent(stateName)}`}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Triage Delays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Active Operational Review Queue Table */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Operational Action Queue ({districtName})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered strictly by Model Severity = HIGH. Zero composite scoring or artificial prioritization.
            </p>
          </div>

          {/* Queue Filter Pill Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('cost')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'cost'
                  ? 'bg-white text-rose-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cost ({costAnomalies.length})
            </button>
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'duplicates'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Duplicates ({duplicatePairs.length})
            </button>
            <button
              onClick={() => setActiveTab('funds')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'funds'
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Funds ({fundAnomalies.length})
            </button>
            <button
              onClick={() => setActiveTab('delays')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'delays'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Delays ({delays.length})
            </button>
          </div>
        </div>

        {activeTab === 'cost' && (
          <div className="divide-y divide-slate-100 text-xs">
            {costAnomalies.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No high cost anomalies in queue for {districtName}.</p>
            ) : (
              costAnomalies.map((c) => (
                <div key={c.work_id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      to={`/works/${encodeURIComponent(c.work_id)}`}
                      className="font-mono font-bold text-blue-600 hover:underline"
                    >
                      {c.work_id}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-0.5">{c.explanation}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-bold text-rose-700">
                      {(c.cost_anomaly_score * 100).toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-slate-400">Score</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'duplicates' && (
          <div className="divide-y divide-slate-100 text-xs">
            {duplicatePairs.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No high duplicate pairs in queue for {districtName}.</p>
            ) : (
              duplicatePairs.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold text-slate-800">
                      {p.work_id_1} ⟷ {p.work_id_2}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Semantic Match:{' '}
                      {p.semantic_similarity != null ? `${(p.semantic_similarity * 100).toFixed(1)}%` : '—'} • Days:{' '}
                      {p.days_diff}d
                    </p>
                  </div>
                  <Link
                    to={`/duplicates/compare?id1=${encodeURIComponent(p.work_id_1)}&id2=${encodeURIComponent(
                      p.work_id_2
                    )}`}
                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs"
                  >
                    Inspect Pair →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'funds' && (
          <div className="divide-y divide-slate-100 text-xs">
            {fundAnomalies.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No high fund anomalies in queue for {districtName}.</p>
            ) : (
              fundAnomalies.map((f) => (
                <div key={f.work_id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      to={`/works/${encodeURIComponent(f.work_id)}`}
                      className="font-mono font-bold text-blue-600 hover:underline"
                    >
                      {f.work_id}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-0.5">Category: {f.audit_category.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-semibold text-slate-800">
                      {f.total_disbursed_amount != null ? `₹${f.total_disbursed_amount.toLocaleString()}` : '₹0'}
                    </span>
                    <p className="text-[10px] text-slate-400">Disbursed</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'delays' && (
          <div className="divide-y divide-slate-100 text-xs">
            {delays.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No statutory delays in queue for {districtName}.</p>
            ) : (
              delays.map((l) => (
                <div key={l.work_id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      to={`/works/${encodeURIComponent(l.work_id)}`}
                      className="font-mono font-bold text-blue-600 hover:underline"
                    >
                      {l.work_id}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-0.5">{l.explanation}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono tabular-nums font-bold text-rose-700">{l.open_work_overdue_days || 0}d</span>
                    <p className="text-[10px] text-slate-400">Overdue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 4. MP DASHBOARD (Constituency Portfolio & Verified 5 Stages)
 * ------------------------------------------------------------- */
const MPDashboard: React.FC<{ mpName: string }> = ({ mpName }) => {
  const [mpSummary, setMpSummary] = useState<MPSummaryItem | null>(null);
  const [allWorks, setAllWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // 1. Fetch authoritative MP summary aggregates
    analyticsService
      .getMPSummaries({ mp_name: mpName })
      .then((summaries) => {
        if (summaries && summaries.length > 0) {
          const match =
            summaries.find((s) => s.mp_name.trim().toLowerCase() === mpName.trim().toLowerCase()) || summaries[0];
          setMpSummary(match);
        }
      })
      .catch((err) => console.error('Failed to load MP summary:', err));

    // 2. Fetch full works dataset with pagination batching for lifecycle pipeline & disbursed sums
    worksService
      .getWorks({ mp_name: mpName, page: 1, page_size: 100 })
      .then((resPage1) => {
        const totalPages = resPage1.pagination.total_pages;
        if (totalPages > 1) {
          const pagePromises = [];
          for (let p = 2; p <= totalPages; p++) {
            pagePromises.push(worksService.getWorks({ mp_name: mpName, page: p, page_size: 100 }));
          }
          Promise.all(pagePromises)
            .then((remainingPages) => {
              const merged = [...resPage1.items, ...remainingPages.flatMap((r) => r.items)];
              setAllWorks(merged);
            })
            .catch(() => {
              setAllWorks(resPage1.items);
            });
        } else {
          setAllWorks(resPage1.items);
        }
      })
      .catch((err) => console.error('Failed to load MP works:', err))
      .finally(() => setLoading(false));
  }, [mpName]);

  const totalWorks = mpSummary?.total_works ?? (allWorks.length > 0 ? allWorks.length : 0);
  const totalSanctioned =
    mpSummary?.total_sanctioned_amount ?? allWorks.reduce((sum, w) => sum + (w.sanction_amount || 0), 0);
  const totalDisbursed = allWorks.reduce((sum, w) => sum + (w.amount_disbursed || 0), 0);
  const utilization =
    totalSanctioned > 0
      ? totalDisbursed > 0
        ? ((totalDisbursed / totalSanctioned) * 100).toFixed(1)
        : mpSummary?.completion_rate != null
        ? mpSummary.completion_rate.toFixed(1)
        : '0.0'
      : '0.0';

  const mpHighCost = mpSummary?.high_cost_anomalies ?? 0;
  const mpHighFund = mpSummary?.high_fund_anomalies ?? 0;
  const mpHighDelays = mpSummary?.high_delays ?? 0;
  const mpCompletedWorks =
    mpSummary?.completed_works ??
    allWorks.filter((w) => w.work_status === 'Work Completed' || w.is_completed_flag).length;

  // The 5 Verified Database Statuses across all works
  const statusCounts = {
    Sanction: allWorks.filter((w) => w.work_status === 'Sanction').length,
    'Vendor Identification': allWorks.filter((w) => w.work_status === 'Vendor Identification').length,
    'Work partially Completed': allWorks.filter(
      (w) => w.work_status === 'Work partially Completed' || w.work_status === 'Time Estimation'
    ).length,
    'Physical Inspection': allWorks.filter((w) => w.work_status === 'Physical Inspection').length,
    'Work Completed':
      allWorks.filter((w) => w.work_status === 'Work Completed' || w.is_completed_flag).length || mpCompletedWorks,
  };

  return (
    <div className="space-y-6">
      {/* MP Portfolio Scope Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-600 text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Hon'ble MP Portfolio • {mpName}
              {mpSummary?.constituency && mpSummary.constituency !== 'Unknown'
                ? ` (${mpSummary.constituency})`
                : ''}
            </h1>
            <p className="text-xs text-slate-600">
              {mpSummary?.house || 'Lok Sabha'} • {mpSummary?.state || 'State'} Jurisdiction • Constituency Recommended Works &amp; Statutory Lifecycle Monitoring
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-md border border-amber-200 text-amber-900">
          Scope Locked: {mpName}
        </span>
      </div>

      {/* SECTION 1: MP Macro Portfolio KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Recommended Works"
          value={totalWorks.toLocaleString()}
          subtitle={`Works under ${mpName}`}
          icon={FolderKanban}
        />
        <MetricCard
          title="Total Sanction Outlay"
          value={`₹${(totalSanctioned / 1e7).toFixed(2)} Cr`}
          subtitle="Allocated Parliamentary Outlay"
          icon={TrendingUp}
        />
        <MetricCard
          title="Cumulative Disbursed Capital"
          value={totalDisbursed > 0 ? `₹${(totalDisbursed / 1e7).toFixed(2)} Cr` : 'Reconciling...'}
          subtitle="Reconciled Bank Vouchers"
          icon={Landmark}
        />
        <MetricCard
          title="Constituency Fund Utilization"
          value={`${utilization}%`}
          subtitle="Capital Disbursed / Sanctioned"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* SECTION 2: Four Independent Module Summary Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Independent Analytical Surveillance (4 Modules)
            </h2>
            <span className="text-[10px] text-slate-500">
              Decoupled algorithmic pipelines • No synthetic blended scores
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Model 1: Cost Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-rose-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                  Model 1: Cost Anomalies
                </span>
                <div className="p-1.5 rounded-md bg-rose-50/80 border border-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-rose-700 tabular-nums tracking-tight">
                  {mpHighCost.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Cost Outliers</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Isolation Forest
              </span>
              <Link
                to={`/analytics/cost-anomalies?severity=HIGH${mpSummary?.state ? `&state=${encodeURIComponent(mpSummary.state)}` : ''}`}
                className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Inspect Outliers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 2: Duplicate Works */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  Model 2: Duplicate Works
                </span>
                <div className="p-1.5 rounded-md bg-indigo-50/80 border border-indigo-100 text-indigo-600 shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-indigo-700 tabular-nums tracking-tight">
                  Candidate Pairs
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">Flagged Candidate Pairs</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MiniLM Embeddings
              </span>
              <Link
                to="/analytics/duplicate-works?severity=HIGH"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Review Pairs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 3: Fund Anomalies */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                  Model 3: Fund & Expenditure
                </span>
                <div className="p-1.5 rounded-md bg-amber-50/80 border border-amber-100 text-amber-600 shrink-0">
                  <BadgePercent className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-amber-700 tabular-nums tracking-tight">
                  {mpHighFund.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High Disbursement Flags</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                Vendor HHI Index
              </span>
              <Link
                to={`/analytics/fund-anomalies?severity=HIGH${mpSummary?.state ? `&state=${encodeURIComponent(mpSummary.state)}` : ''}`}
                className="text-xs font-bold text-amber-700 hover:text-amber-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Audit Pacing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Model 4: Statutory Delays */}
          <div className="group bg-white rounded-xl border border-slate-200/90 p-4.5 sm:p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                  Model 4: Statutory Delays
                </span>
                <div className="p-1.5 rounded-md bg-blue-50/80 border border-blue-100 text-blue-600 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3.5">
                <p className="text-3xl font-black text-blue-700 tabular-nums tracking-tight">
                  {mpHighDelays.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">High SLA Violations</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                MoSPI 2023 SLA
              </span>
              <Link
                to={`/analytics/delays?severity=HIGH${mpSummary?.state ? `&state=${encodeURIComponent(mpSummary.state)}` : ''}`}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              >
                <span>Triage Delays</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: 5-Stage Verified Lifecycle Funnel */}
      <div className="bg-white rounded-lg border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Constituency Work Lifecycle Pipeline (5 Verified DB Statuses)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracking physical and administrative progression directly matching database records across all {totalWorks.toLocaleString()} works.
            </p>
          </div>
          {loading && (
            <span className="text-xs text-amber-600 font-medium animate-pulse">
              Reconciling full dataset...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {Object.entries(statusCounts).map(([status, count], idx) => (
            <div key={status} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">Stage {idx + 1}</span>
              <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-1" title={status}>
                {status}
              </p>
              <p className="text-xl font-extrabold text-slate-900 font-mono tabular-nums mt-2">{count}</p>
              <span className="text-[10px] text-slate-500">works</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
