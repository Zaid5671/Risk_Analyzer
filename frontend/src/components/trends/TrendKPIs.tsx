import React from 'react';
import {
  AlertTriangle,
  Copy,
  BadgePercent,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
} from 'lucide-react';
import type { CredibilityTier, Trajectory } from '@/types/trends';

interface TrendKPIsProps {
  latestTrend: any | null;
  grain: 'NATIONAL' | 'STATE' | 'DISTRICT' | 'MP';
  credibilityTier?: CredibilityTier;
  peerBenchmark?: any;
}

const formatCurrencyCr = (val?: number) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0 Cr';
  const cr = val / 10000000;
  return `₹${cr.toFixed(2)} Cr`;
};

const getTrajectoryBadge = (trajectory?: Trajectory) => {
  switch (trajectory) {
    case 'IMPROVING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <TrendingDown className="w-3 h-3 text-emerald-400" />
          IMPROVING
        </span>
      );
    case 'DETERIORATING':
    case 'SUSTAINED_INCREASE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <TrendingUp className="w-3 h-3 text-rose-400" />
          {trajectory === 'SUSTAINED_INCREASE' ? 'SPIKE DETECTED' : 'DETERIORATING'}
        </span>
      );
    case 'STABLE':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/60 text-slate-300 border border-slate-600">
          <Minus className="w-3 h-3 text-slate-400" />
          STABLE
        </span>
      );
  }
};

const getCredibilityBadge = (tier?: CredibilityTier) => {
  switch (tier) {
    case 'ROBUST':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
          ROBUST (N≥100)
        </span>
      );
    case 'MODERATE':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">
          MODERATE (30-99)
        </span>
      );
    case 'LOW_VOLUME':
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-900/40 text-amber-300 border border-amber-700/50">
          LOW VOLUME (10-29)
        </span>
      );
    case 'INSUFFICIENT':
    default:
      return (
        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-900/40 text-rose-300 border border-rose-700/50">
          INSUFFICIENT (&lt;10)
        </span>
      );
  }
};

export const TrendKPIs: React.FC<TrendKPIsProps> = ({
  latestTrend,
  grain,
  credibilityTier,
  peerBenchmark,
}) => {
  if (!latestTrend) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const tier = credibilityTier || latestTrend.credibility_tier || 'ROBUST';

  return (
    <div className="px-6 py-4">
      {/* 4 Independent Track Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Track 1: Cost Anomaly */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-rose-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Cost Anomaly Track</span>
              </div>
              {getTrajectoryBadge(latestTrend.cost_trajectory)}
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {latestTrend.cost_anomaly_rate !== null && latestTrend.cost_anomaly_rate !== undefined
                    ? `${(latestTrend.cost_anomaly_rate * 100).toFixed(2)}%`
                    : 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400">rate</span>
              </div>

              {latestTrend.cost_anomaly_rate_smoothed !== undefined && latestTrend.cost_anomaly_rate_smoothed !== null && (
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                  <span>Smoothed (Bayes):</span>
                  <span className="font-mono text-rose-300 font-medium">
                    {(latestTrend.cost_anomaly_rate_smoothed * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Excess Exposure:</span>
            <span className="font-semibold text-rose-400 font-mono">
              {formatCurrencyCr(latestTrend.excess_sanctioned_amount_inr || 0)}
            </span>
          </div>
        </div>

        {/* Track 2: Duplicate Works */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-indigo-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Copy className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Duplicate Work Track</span>
              </div>
              {getCredibilityBadge(tier)}
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {latestTrend.duplicate_work_rate !== null && latestTrend.duplicate_work_rate !== undefined
                    ? `${(latestTrend.duplicate_work_rate * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400">unique works</span>
              </div>

              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span>Cluster Density:</span>
                <span className="font-mono text-indigo-300 font-medium">
                  {latestTrend.duplicate_cluster_density ? `${latestTrend.duplicate_cluster_density.toFixed(1)}x` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Duplicate Exposure:</span>
            <span className="font-semibold text-indigo-400 font-mono">
              {formatCurrencyCr(latestTrend.duplicate_exposure_inr || 0)}
            </span>
          </div>
        </div>

        {/* Track 3: Fund Anomaly */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-amber-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BadgePercent className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Fund & Spend Track</span>
              </div>
              {getTrajectoryBadge(latestTrend.fund_trajectory)}
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {latestTrend.fund_anomaly_rate !== null && latestTrend.fund_anomaly_rate !== undefined
                    ? `${(latestTrend.fund_anomaly_rate * 100).toFixed(2)}%`
                    : 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400">anomaly rate</span>
              </div>

              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Dormant (180d+):</span>
                <span className="font-mono text-amber-300 font-medium">
                  {latestTrend.dormant_sanction_count ?? 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Status Mismatches:</span>
            <span className="font-semibold text-amber-400 font-mono">
              {latestTrend.status_mismatch_count ?? 'N/A'} works
            </span>
          </div>
        </div>

        {/* Track 4: Statutory Delay Track */}
        <div className="bg-slate-900/90 rounded-xl p-4 border border-blue-500/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-300">Statutory SLA (Para 3.12)</span>
              </div>
              {getTrajectoryBadge(latestTrend.delay_trajectory)}
            </div>

            <div className="mt-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {latestTrend.sanction_sla_compliance_rate !== null && latestTrend.sanction_sla_compliance_rate !== undefined
                    ? `${(latestTrend.sanction_sla_compliance_rate * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
                <span className="text-[11px] text-slate-400">75d compliant</span>
              </div>

              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <span>Mean Rec-to-Sanc:</span>
                <span className="font-mono text-blue-300 font-medium">
                  {latestTrend.mean_rec_to_sanc_delay_days ? `${latestTrend.mean_rec_to_sanc_delay_days.toFixed(0)} days` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Delay Rate:</span>
            <span className="font-semibold text-blue-400 font-mono">
              {latestTrend.delay_rate ? `${(latestTrend.delay_rate * 100).toFixed(1)}%` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* PS 26102 Compliance Banner */}
      <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>
            Strict Module Isolation: Cost Anomaly, Duplicate Work, Fund Flow, and Statutory SLA tracked independently without composite aggregation.
          </span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Latest Reference Quarter: <span className="text-slate-300 font-semibold">{latestTrend.year_quarter || latestTrend.fiscal_year_or_quarter}</span>
        </div>
      </div>
    </div>
  );
};
