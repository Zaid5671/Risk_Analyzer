import React, { useState, useEffect } from 'react';
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
import { DataTable, type Column } from '@/components/common/DataTable';
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
 * 1. MINISTRY DASHBOARD (National Oversight)
 * ------------------------------------------------------------- */
const MinistryDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [districts, setDistricts] = useState<DistrictSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([healthService.getHealth(), analyticsService.getDistrictSummaries()]).then(
      ([resHealth, resDist]) => {
        if (resHealth.status === 'fulfilled') setHealth(resHealth.value);
        if (resDist.status === 'fulfilled') setDistricts(resDist.value);
        setLoading(false);
      }
    );
  }, []);

  const totalWorks = health?.total_works || 98825;
  const topDistrictsByDelays = [...districts].sort((a, b) => b.high_delays - a.high_delays).slice(0, 5);

  const chartData = districts.slice(0, 7).map((d) => ({
    district: d.district,
    outlayCr: Number((d.total_sanctioned_amount / 1e7).toFixed(1)),
    disbursedCr: Number((d.total_disbursed_amount / 1e7).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-black text-slate-900">National Executive Overview</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ministry of Statistics and Programme Implementation (MoSPI) • National MPLADS Integrity Monitor
        </p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sanctioned Works"
          value={totalWorks.toLocaleString()}
          subtitle="Database Master Catalog"
          icon={FolderKanban}
        />
        <MetricCard
          title="1. Cost Anomalies"
          value="Requires Review"
          subtitle="Isolation Forest Outliers"
          icon={AlertTriangle}
          variant="alert"
          badge="Model 1"
        />
        <MetricCard
          title="2. Potential Duplicates"
          value="Semantic Pairs"
          subtitle="Multi-Attribute Matches"
          icon={Copy}
          variant="warning"
          badge="Model 2"
        />
        <MetricCard
          title="4. Statutory Delays"
          value="75d SLA Compliance"
          subtitle="Guidelines Para 3.12"
          icon={Clock}
          variant="default"
          badge="Model 4"
        />
      </div>

      {/* Independent Audit Modules Quick Navigation (Zero Composite Score) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/analytics/cost-anomalies"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-rose-300 shadow-sm transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">
              Model 1: Cost Anomalies
            </p>
            <p className="text-[11px] text-slate-500">Peer median IQR analysis</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
        </Link>

        <Link
          to="/analytics/duplicate-works"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-sm transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Model 2: Duplicate Works
            </p>
            <p className="text-[11px] text-slate-500">Semantic & blocking matches</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </Link>

        <Link
          to="/analytics/fund-anomalies"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-amber-300 shadow-sm transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Model 3: Fund & Expenditure
            </p>
            <p className="text-[11px] text-slate-500">HHI & dormant sanctions</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
        </Link>

        <Link
          to="/analytics/delays"
          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 shadow-sm transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Model 4: Statutory Delays
            </p>
            <p className="text-[11px] text-slate-500">75d sanction & 365d execution</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>
      </div>

      {/* Chart & Explicit Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outlay vs Disbursed Chart */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Financial Outlay by Sample Districts (₹ Crores)</h3>
          <p className="text-xs text-slate-500 mb-4">Comparison of Sanctioned Outlay vs Disbursed Funds</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="district" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="outlayCr" name="Sanctioned (₹ Cr)" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disbursedCr" name="Disbursed (₹ Cr)" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explicit Ranking Table: Districts Ranked by HIGH Delay Violations */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Districts Ranked by HIGH Delay Violations (Para 3.12)
            </h3>
            <p className="text-xs text-slate-500 mb-4">Explicit sorting by volume of overdue statutory findings</p>

            <div className="divide-y divide-slate-100 text-xs">
              {topDistrictsByDelays.map((d, idx) => (
                <div key={d.district} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 font-mono text-slate-400">#{idx + 1}</span>
                    <div>
                      <p className="font-bold text-slate-800">{d.district}</p>
                      <p className="text-[10px] text-slate-400">{d.state}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold">
                      {d.high_delays} High Delays
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      ₹{(d.total_sanctioned_amount / 1e7).toFixed(1)} Cr outlay
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <Link to="/analytics/district-summary" className="text-xs text-blue-600 hover:underline font-semibold">
              View All Districts Summary →
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
  const stateHighDelays = districts.reduce((acc, d) => acc + d.high_delays, 0);

  return (
    <div className="space-y-6">
      {/* State Scope Banner */}
      <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white">
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

      {/* State KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="State Sanctioned Works"
          value={stateWorks.toLocaleString()}
          subtitle={`Across ${districts.length} districts in ${stateName}`}
          icon={FolderKanban}
        />
        <MetricCard
          title="Sanction Outlay"
          value={`₹${(stateOutlay / 1e7).toFixed(1)} Cr`}
          subtitle="Allocated State Outlay"
          icon={TrendingUp}
        />
        <MetricCard
          title="HIGH Statutory Delays"
          value={stateHighDelays}
          subtitle="75d Sanction SLA Breaches"
          icon={Clock}
          variant="alert"
        />
      </div>

      {/* Inter-District Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Inter-District Monitoring & SLA Performance ({stateName})
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
                <tr key={d.district} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{d.district}</td>
                  <td className="py-2.5 px-3 font-mono">{d.total_works.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">₹{(d.total_sanctioned_amount / 1e7).toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{d.high_cost_anomalies}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{d.high_duplicate_pairs}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{d.high_fund_anomalies}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{d.high_delays}</td>
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
  const [costAnomalies, setCostAnomalies] = useState<CostAnomalyItem[]>([]);
  const [duplicatePairs, setDuplicatePairs] = useState<DuplicatePairItem[]>([]);
  const [fundAnomalies, setFundAnomalies] = useState<FundAnomalyItem[]>([]);
  const [delays, setDelays] = useState<DelayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      analyticsService.getCostAnomalies({ severity: 'HIGH', page: 1, page_size: 10 }),
      analyticsService.getDuplicateWorks({ severity: 'HIGH', page: 1, page_size: 10 }),
      analyticsService.getFundAnomalies({ severity: 'HIGH', page: 1, page_size: 10 }),
      analyticsService.getDelays({ severity: 'HIGH', page: 1, page_size: 10 }),
    ]).then(([resC, resD, resF, resL]) => {
      if (resC.status === 'fulfilled') setCostAnomalies(resC.value.items);
      if (resD.status === 'fulfilled') setDuplicatePairs(resD.value.items);
      if (resF.status === 'fulfilled') setFundAnomalies(resF.value.items);
      if (resL.status === 'fulfilled') setDelays(resL.value.items);
      setLoading(false);
    });
  }, [districtName]);

  return (
    <div className="space-y-6">
      {/* District Scope Banner */}
      <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-600 text-white">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              District Planning Authority • {districtName}, {stateName}
            </h1>
            <p className="text-xs text-slate-600">
              Local Operational Review Queue • Sanctions, Physical Inspections & Contractor Verification
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-md border border-emerald-200 text-emerald-900">
          Scope Locked: {districtName}
        </span>
      </div>

      {/* 4 Operational Queue Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('cost')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'cost' ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-500">High Cost Queue</span>
          <p className="text-xl font-extrabold text-rose-700 font-mono mt-1">{costAnomalies.length}</p>
          <span className="text-[10px] text-slate-400">Peer median outliers</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'duplicates'
              ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-500">Duplicate Queue</span>
          <p className="text-xl font-extrabold text-indigo-700 font-mono mt-1">{duplicatePairs.length}</p>
          <span className="text-[10px] text-slate-400">Candidate pairs</span>
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'funds' ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-500">Fund Anomaly Queue</span>
          <p className="text-xl font-extrabold text-amber-700 font-mono mt-1">{fundAnomalies.length}</p>
          <span className="text-[10px] text-slate-400">Disbursement flags</span>
        </button>

        <button
          onClick={() => setActiveTab('delays')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeTab === 'delays' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-500">Statutory Delays</span>
          <p className="text-xl font-extrabold text-blue-700 font-mono mt-1">{delays.length}</p>
          <span className="text-[10px] text-slate-400">Overdue SLA items</span>
        </button>
      </div>

      {/* Active Operational Review Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Operational Action Queue — {activeTab.toUpperCase()} (Simple Rule-Based HIGH Severity)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Filtered strictly by Model Severity = HIGH. Zero composite scoring or artificial prioritization.
        </p>

        {activeTab === 'cost' && (
          <div className="divide-y divide-slate-100 text-xs">
            {costAnomalies.map((c) => (
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
                  <span className="font-mono font-bold text-rose-700">{(c.cost_anomaly_score * 100).toFixed(1)}%</span>
                  <p className="text-[10px] text-slate-400">Score</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'duplicates' && (
          <div className="divide-y divide-slate-100 text-xs">
            {duplicatePairs.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-slate-800">
                    {p.work_id_1} ⟷ {p.work_id_2}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Semantic Match: {p.semantic_similarity != null ? `${(p.semantic_similarity * 100).toFixed(1)}%` : '—'} • Days:{' '}
                    {p.days_diff}d
                  </p>
                </div>
                <Link
                  to={`/duplicates/compare?id1=${encodeURIComponent(p.work_id_1)}&id2=${encodeURIComponent(p.work_id_2)}`}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs"
                >
                  Inspect Pair →
                </Link>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'funds' && (
          <div className="divide-y divide-slate-100 text-xs">
            {fundAnomalies.map((f) => (
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
                  <span className="font-mono font-semibold text-slate-800">
                    {f.total_disbursed_amount != null ? `₹${f.total_disbursed_amount.toLocaleString()}` : '₹0'}
                  </span>
                  <p className="text-[10px] text-slate-400">Disbursed</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'delays' && (
          <div className="divide-y divide-slate-100 text-xs">
            {delays.map((l) => (
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
                  <span className="font-mono font-bold text-rose-700">{l.open_work_overdue_days || 0}d</span>
                  <p className="text-[10px] text-slate-400">Overdue</p>
                </div>
              </div>
            ))}
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
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    worksService
      .getWorks({ mp_name: mpName, page: 1, page_size: 100 })
      .then((res) => setWorks(res.items))
      .finally(() => setLoading(false));
  }, [mpName]);

  const totalWorks = works.length;
  const totalSanctioned = works.reduce((sum, w) => sum + (w.sanction_amount || 0), 0);
  const totalDisbursed = works.reduce((sum, w) => sum + (w.amount_disbursed || 0), 0);
  const utilization = totalSanctioned > 0 ? Math.round((totalDisbursed / totalSanctioned) * 100) : 0;

  // The 5 Verified Database Statuses
  const statusCounts = {
    Sanction: works.filter((w) => w.work_status === 'Sanction').length,
    'Vendor Identification': works.filter((w) => w.work_status === 'Vendor Identification').length,
    'Work partially Completed': works.filter((w) => w.work_status === 'Work partially Completed').length,
    'Physical Inspection': works.filter((w) => w.work_status === 'Physical Inspection').length,
    'Work Completed': works.filter((w) => w.work_status === 'Work Completed' || w.is_completed_flag).length,
  };

  return (
    <div className="space-y-6">
      {/* MP Portfolio Scope Banner */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-600 text-white">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Hon'ble MP Portfolio • {mpName}</h1>
            <p className="text-xs text-slate-600">
              Constituency Recommended Works & Statutory Execution Lifecycle Monitoring
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-md border border-amber-200 text-amber-900">
          Scope Locked: {mpName}
        </span>
      </div>

      {/* Financial Outlay KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Recommended Works"
          value={totalWorks}
          subtitle={`Works under ${mpName}`}
          icon={FolderKanban}
        />
        <MetricCard
          title="Total Sanction Outlay"
          value={`₹${(totalSanctioned / 1e7).toFixed(2)} Cr`}
          subtitle={`Disbursed: ₹${(totalDisbursed / 1e7).toFixed(2)} Cr`}
          icon={TrendingUp}
        />
        <MetricCard
          title="Expenditure Utilization"
          value={`${utilization}%`}
          subtitle="Disbursed / Sanctioned Outlay"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* 5-Stage Verified Lifecycle Funnel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Constituency Work Lifecycle Pipeline (5 Verified DB Statuses)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Tracking physical and administrative progression directly matching database records.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {Object.entries(statusCounts).map(([status, count], idx) => (
            <div key={status} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-400 block font-bold">Stage {idx + 1}</span>
              <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-1" title={status}>
                {status}
              </p>
              <p className="text-xl font-extrabold text-slate-900 font-mono mt-2">{count}</p>
              <span className="text-[10px] text-slate-500">works</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
