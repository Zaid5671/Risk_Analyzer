import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Copy,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Flame,
  CheckCircle,
} from 'lucide-react';
import type { EarlyWarningItem } from '@/types/trends';

interface EarlyWarningQueueProps {
  alerts: EarlyWarningItem[];
  totalAlerts: number;
  criticalCount: number;
  watchlistCount: number;
  loading: boolean;
  warningTypeFilter: string | null;
  onSelectWarningType: (type: string | null) => void;
  urgencyFilter: string | null;
  onSelectUrgency: (urgency: string | null) => void;
}

const formatCurrencyLakhs = (amt?: number) => {
  if (amt === undefined || amt === null) return '₹0 L';
  const l = amt / 100000;
  return `₹${l.toFixed(2)} L`;
};

export const EarlyWarningQueue: React.FC<EarlyWarningQueueProps> = ({
  alerts,
  totalAlerts,
  criticalCount,
  watchlistCount,
  loading,
  warningTypeFilter,
  onSelectWarningType,
  urgencyFilter,
  onSelectUrgency,
}) => {
  return (
    <div className="px-6 py-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Pre-Breach Action Queue: Live Early Warnings</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {totalAlerts.toLocaleString()} Active Warnings
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Proactive administrative alerts prior to statutory SLA breach or fiscal dormancy.
              </p>
            </div>
          </div>

          {/* Quick Urgency Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectUrgency(urgencyFilter === 'CRITICAL' ? null : 'CRITICAL')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                urgencyFilter === 'CRITICAL'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Critical ({criticalCount.toLocaleString()})</span>
            </button>
            <button
              onClick={() => onSelectUrgency(urgencyFilter === 'WATCHLIST' ? null : 'WATCHLIST')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                urgencyFilter === 'WATCHLIST'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60 border border-amber-800/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Watchlist ({watchlistCount.toLocaleString()})</span>
            </button>
          </div>
        </div>

        {/* Filter Pills for Warning Types */}
        <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium mr-1">Alert Category:</span>

          <button
            onClick={() => onSelectWarningType(null)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              warningTypeFilter === null
                ? 'bg-slate-700 text-white font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Active Alerts
          </button>

          <button
            onClick={() => onSelectWarningType('SLA_SANCTION_CLIFF')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              warningTypeFilter === 'SLA_SANCTION_CLIFF'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>SLA Sanction Cliff (45–74d Countdown)</span>
          </button>

          <button
            onClick={() => onSelectWarningType('STAGNATION_INCUBATION')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              warningTypeFilter === 'STAGNATION_INCUBATION'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Stagnation Incubation (180–365d ₹0 Spend)</span>
          </button>

          <button
            onClick={() => onSelectWarningType('BATCH_DUPLICATE_CLUSTER')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
              warningTypeFilter === 'BATCH_DUPLICATE_CLUSTER'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-indigo-400" />
            <span>Batch Duplicate Clusters</span>
          </button>
        </div>

        {/* Alert Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Work ID</th>
                <th className="py-2.5 px-3">Warning Type</th>
                <th className="py-2.5 px-3">Jurisdiction / MP</th>
                <th className="py-2.5 px-3 text-right">Sanction Amount</th>
                <th className="py-2.5 px-3 text-center">Breach Countdown</th>
                <th className="py-2.5 px-3 text-center">Urgency</th>
                <th className="py-2.5 px-4">Recommended Statutory Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                      <span>Loading pre-breach alerts...</span>
                    </div>
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                    <p className="text-sm font-medium text-slate-300">No active warnings for the selected filters.</p>
                    <p className="text-xs text-slate-400 mt-1">All monitored works are within normal statutory operating thresholds.</p>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.work_id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Work ID */}
                    <td className="py-2.5 px-4 font-mono font-medium text-blue-400">
                      <Link
                        to={`/works/${encodeURIComponent(alert.work_id)}`}
                        className="hover:underline flex items-center gap-1 group"
                      >
                        <span>{alert.work_id}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    {/* Warning Type Badge */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-slate-200">
                          {alert.warning_type === 'SLA_SANCTION_CLIFF' && 'SLA Sanction Cliff'}
                          {alert.warning_type === 'STAGNATION_INCUBATION' && 'Stagnation Incubation'}
                          {alert.warning_type === 'BATCH_DUPLICATE_CLUSTER' && 'Batch Duplicate Cluster'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          [{alert.paradigm}]
                        </span>
                      </div>
                    </td>

                    {/* Jurisdiction */}
                    <td className="py-2.5 px-3">
                      <div className="text-slate-300 font-medium">{alert.district}, {alert.state}</div>
                      {alert.mp_name && (
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                          MP: {alert.mp_name}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-200">
                      {formatCurrencyLakhs(alert.sanction_amount)}
                    </td>

                    {/* Breach Countdown */}
                    <td className="py-2.5 px-3 text-center">
                      {alert.warning_type === 'SLA_SANCTION_CLIFF' ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              alert.days_to_statutory_breach !== null && alert.days_to_statutory_breach <= 15
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {alert.days_to_statutory_breach}d to breach
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
                            {alert.days_elapsed}d elapsed (of 75d)
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            {alert.days_elapsed}d elapsed
                          </span>
                          <span className="text-[9px] text-amber-400/80 mt-0.5 font-mono">
                            ₹0 disbursement
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Urgency */}
                    <td className="py-2.5 px-3 text-center">
                      {alert.urgency_level === 'CRITICAL' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          CRITICAL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          WATCHLIST
                        </span>
                      )}
                    </td>

                    {/* Recommended Action */}
                    <td className="py-2.5 px-4 text-slate-300 text-[11px] leading-relaxed max-w-[320px]">
                      {alert.action_recommended}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between text-[11px] text-slate-400">
          <span>Showing top {alerts.length} actionable alerts</span>
          <span className="font-mono text-[10px]">Statutory SLA Enforcement Para 3.12 (MoSPI)</span>
        </div>
      </div>
    </div>
  );
};
