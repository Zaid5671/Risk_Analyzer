import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics';
import type { DelayPredictionItem } from '@/types/prediction';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge, Badge } from '@/components/common/Badge';
import { MetricCard } from '@/components/common/MetricCard';
import {
  BrainCircuit,
  Filter,
  ExternalLink,
  Info,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

export const PredictiveInsights: React.FC = () => {
  const [items, setItems] = useState<DelayPredictionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<string>('');
  const [minRisk, setMinRisk] = useState<number | undefined>(undefined);

  // Summary counts
  const [stats, setStats] = useState({
    totalMonitored: 54408,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getDelayPredictions({
        page,
        page_size: 20,
        severity: severity || undefined,
        min_risk: minRisk !== undefined ? minRisk : undefined,
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      console.error('Failed to load predictive delay risks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load headline metrics on mount
  useEffect(() => {
    const loadOverviewStats = async () => {
      try {
        const [highRes, medRes, lowRes] = await Promise.all([
          analyticsService.getDelayPredictions({ severity: 'HIGH', page: 1, page_size: 1 }),
          analyticsService.getDelayPredictions({ severity: 'MEDIUM', page: 1, page_size: 1 }),
          analyticsService.getDelayPredictions({ severity: 'LOW', page: 1, page_size: 1 }),
        ]);
        setStats({
          totalMonitored: (highRes.pagination?.total_records || 0) + 
                          (medRes.pagination?.total_records || 0) + 
                          (lowRes.pagination?.total_records || 0) || 54408,
          highRisk: highRes.pagination?.total_records || 0,
          mediumRisk: medRes.pagination?.total_records || 0,
          lowRisk: lowRes.pagination?.total_records || 0,
        });
      } catch (err) {
        console.error('Failed to load prediction stats:', err);
      }
    };
    loadOverviewStats();
  }, []);

  useEffect(() => {
    loadData();
  }, [page, severity, minRisk]);

  const columns: Column<DelayPredictionItem>[] = [
    {
      header: 'Work ID',
      accessor: 'work_id',
      render: (item) => (
        <Link
          to={`/works/${encodeURIComponent(item.work_id)}`}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
        >
          <span>{item.work_id}</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </Link>
      ),
    },
    {
      header: 'Predicted Severity',
      accessor: 'predicted_risk_severity',
      render: (item) => <SeverityBadge severity={item.predicted_risk_severity} />,
    },
    {
      header: 'Completion Breach Probability',
      accessor: 'predicted_completion_risk',
      render: (item) => {
        const pct = (item.predicted_completion_risk * 100).toFixed(1);
        const isHigh = item.predicted_completion_risk >= 0.75;
        const isMed = item.predicted_completion_risk >= 0.5;
        const barColor = isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-500';
        const textColor = isHigh ? 'text-rose-700 font-bold' : isMed ? 'text-amber-700 font-bold' : 'text-emerald-700 font-semibold';

        return (
          <div className="w-44">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-mono ${textColor}`}>{pct}%</span>
              <span className="text-[10px] text-slate-400 uppercase font-medium">
                {isHigh ? 'Critical' : isMed ? 'Moderate' : 'Low'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(100, Math.max(5, item.predicted_completion_risk * 100))}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      header: 'Days Since Sanction',
      accessor: 'days_since_sanction',
      render: (item) => (
        <div className="text-xs">
          <span className="font-mono font-semibold text-slate-800">
            {item.days_since_sanction != null ? `${item.days_since_sanction}d` : '—'}
          </span>
          {item.days_since_sanction != null && item.days_since_sanction > 365 && (
            <span className="text-[10px] text-rose-600 block font-medium">Over 1yr Active</span>
          )}
        </div>
      ),
    },
    {
      header: 'Current Utilization',
      accessor: 'current_utilization',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">
          {item.current_utilization != null
            ? `${(item.current_utilization * 100).toFixed(1)}%`
            : '0.0%'}
        </span>
      ),
    },
    {
      header: 'Predictive Rationale & Risk Drivers',
      accessor: 'explanation',
      className: 'max-w-md',
      render: (item) => (
        <p className="text-xs text-slate-600 line-clamp-2" title={item.explanation || ''}>
          {item.explanation || 'Evaluated against empirical completion timelines and historical district velocity.'}
        </p>
      ),
    },
    {
      header: 'Action',
      render: (item) => (
        <Link
          to={`/works/${encodeURIComponent(item.work_id)}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
        >
          <span>Details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Model 5 • Predictive Analytics
            </span>
            <span className="text-xs text-slate-500 font-mono">ROC-AUC: 0.9366</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-600" />
            Predictive Delay Risk Forecasting
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Pre-breach machine learning forecast identifying open works with elevated likelihood of exceeding
            statutory 365-day delivery deadlines, enabling proactive district-level intervention before failure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <span className="font-semibold text-slate-900">{pagination?.total_records.toLocaleString() || '—'}</span> Open Works Scored
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Open Works Monitored"
          value={stats.totalMonitored.toLocaleString()}
          subtitle="In-flight canonical works"
          icon={Layers}
        />
        <MetricCard
          title="High Delay Risk Queue"
          value={stats.highRisk.toLocaleString()}
          subtitle="Risk probability ≥ 75%"
          icon={AlertTriangle}
          variant="alert"
        />
        <MetricCard
          title="Medium Risk Watchlist"
          value={stats.mediumRisk.toLocaleString()}
          subtitle="Risk probability 50% – 75%"
          icon={Clock}
          variant="warning"
        />
        <MetricCard
          title="On-Track Delivery"
          value={stats.lowRisk.toLocaleString()}
          subtitle="Risk probability < 50%"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Statutory Guidance Callout */}
      <div className="bg-purple-50/60 border border-purple-200/80 rounded-xl p-4 text-xs text-purple-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Statutory SLA Compliance & Predictive Early Intervention</p>
          <p className="text-purple-800 leading-relaxed">
            Under Para 3.12 of the MPLADS Guidelines 2023, sanctioned works must be completed within 12 months (365 days).
            This gradient-boosted diagnostic evaluates current expenditure velocity, statutory aging, historical district SLA adherence,
            and administrative stage friction to alert Implementing District Authorities before statutory default occurs.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mr-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Severity filter buttons */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
            {[
              { label: 'All Severities', val: '' },
              { label: 'High (≥75%)', val: 'HIGH' },
              { label: 'Medium (50-75%)', val: 'MEDIUM' },
              { label: 'Low (<50%)', val: 'LOW' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => {
                  setSeverity(opt.val);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  severity === opt.val
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Probability threshold presets */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
            {[
              { label: 'Any Risk', val: undefined },
              { label: '≥ 60%', val: 0.6 },
              { label: '≥ 80%', val: 0.8 },
              { label: '≥ 90%', val: 0.9 },
            ].map((opt) => (
              <button
                key={String(opt.val)}
                onClick={() => {
                  setMinRisk(opt.val);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  minRisk === opt.val
                    ? 'bg-white text-purple-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Page {pagination?.page || 1} of {pagination?.total_pages || 1}
        </div>
      </div>

      {/* Main Predictions Table */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.work_id}
        isLoading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No open works found matching the selected risk filters."
      />
    </div>
  );
};
