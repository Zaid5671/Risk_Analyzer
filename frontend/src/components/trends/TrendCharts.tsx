import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  AlertTriangle,
  Copy,
  BadgePercent,
  Clock,
  Layers,
  Info,
} from 'lucide-react';

interface TrendChartsProps {
  trends: any[];
  grain: 'NATIONAL' | 'STATE' | 'DISTRICT' | 'MP';
  peerBenchmark?: any;
}

type TrackType = 'cost' | 'duplicate' | 'fund' | 'delay';

export const TrendCharts: React.FC<TrendChartsProps> = ({
  trends,
  grain,
  peerBenchmark,
}) => {
  const [activeTrack, setActiveTrack] = useState<TrackType>('cost');

  if (!trends || trends.length === 0) {
    return (
      <div className="px-6 py-8">
        <div className="h-80 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 text-xs">
          No quarterly trend data available for this selection.
        </div>
      </div>
    );
  }

  // Format data points for charts
  const chartData = trends.map((item) => {
    const qLabel = item.year_quarter || item.fiscal_year_or_quarter || '';
    const costRaw = item.cost_anomaly_rate !== null && item.cost_anomaly_rate !== undefined
      ? +(item.cost_anomaly_rate * 100).toFixed(2)
      : null;
    const costSmoothed = item.cost_anomaly_rate_smoothed !== undefined && item.cost_anomaly_rate_smoothed !== null
      ? +(item.cost_anomaly_rate_smoothed * 100).toFixed(2)
      : costRaw;
    const dupRate = item.duplicate_work_rate !== null && item.duplicate_work_rate !== undefined
      ? +(item.duplicate_work_rate * 100).toFixed(1)
      : null;
    const fundRate = item.fund_anomaly_rate !== null && item.fund_anomaly_rate !== undefined
      ? +(item.fund_anomaly_rate * 100).toFixed(2)
      : null;
    const delayRate = item.delay_rate !== null && item.delay_rate !== undefined
      ? +(item.delay_rate * 100).toFixed(1)
      : null;
    const slaComp = item.sanction_sla_compliance_rate !== null && item.sanction_sla_compliance_rate !== undefined
      ? +(item.sanction_sla_compliance_rate * 100).toFixed(1)
      : null;
    const excessCr = item.excess_sanctioned_amount_inr ? +(item.excess_sanctioned_amount_inr / 10000000).toFixed(2) : 0;
    const dupDensity = item.duplicate_cluster_density ? +item.duplicate_cluster_density.toFixed(1) : 1.0;
    const meanDelay = item.mean_rec_to_sanc_delay_days ? +item.mean_rec_to_sanc_delay_days.toFixed(0) : 0;

    return {
      quarter: qLabel,
      worksCount: item.total_sanctioned_works || 0,
      costRaw,
      costSmoothed,
      excessCr,
      dupRate,
      dupDensity,
      fundRate,
      statusMismatches: item.status_mismatch_count || 0,
      dormantSanctions: item.dormant_sanction_count || 0,
      delayRate,
      slaComp,
      meanDelay,
      credibilityTier: item.credibility_tier || 'ROBUST',
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-bold text-white text-sm">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {d.worksCount} works
          </span>
        </div>

        {activeTrack === 'cost' && (
          <div className="space-y-1">
            <div className="flex justify-between text-rose-300">
              <span>Cost Anomaly Rate:</span>
              <span className="font-mono font-semibold">{d.costRaw !== null ? `${d.costRaw}%` : 'N/A'}</span>
            </div>
            {d.costSmoothed !== d.costRaw && (
              <div className="flex justify-between text-amber-300">
                <span>Smoothed (Bayes):</span>
                <span className="font-mono font-semibold">{d.costSmoothed !== null ? `${d.costSmoothed}%` : 'N/A'}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Excess Sanction:</span>
              <span className="font-mono text-slate-200">₹{d.excessCr} Cr</span>
            </div>
          </div>
        )}

        {activeTrack === 'duplicate' && (
          <div className="space-y-1">
            <div className="flex justify-between text-indigo-300">
              <span>Duplicate Work Rate:</span>
              <span className="font-mono font-semibold">{d.dupRate !== null ? `${d.dupRate}%` : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Cluster Density:</span>
              <span className="font-mono text-slate-200">{d.dupDensity}x works</span>
            </div>
          </div>
        )}

        {activeTrack === 'fund' && (
          <div className="space-y-1">
            <div className="flex justify-between text-amber-300">
              <span>Fund Anomaly Rate:</span>
              <span className="font-mono font-semibold">{d.fundRate !== null ? `${d.fundRate}%` : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Dormant (180d+):</span>
              <span className="font-mono text-slate-200">{d.dormantSanctions} works</span>
            </div>
          </div>
        )}

        {activeTrack === 'delay' && (
          <div className="space-y-1">
            <div className="flex justify-between text-blue-300">
              <span>75d SLA Compliance:</span>
              <span className="font-mono font-semibold">{d.slaComp !== null ? `${d.slaComp}%` : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Delay Anomaly Rate:</span>
              <span className="font-mono text-slate-200">{d.delayRate !== null ? `${d.delayRate}%` : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Mean Rec-to-Sanc:</span>
              <span className="font-mono text-slate-200">{d.meanDelay} days</span>
            </div>
          </div>
        )}

        <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
          <span>Tier:</span>
          <span className="font-mono text-slate-300">{d.credibilityTier}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-6 py-3">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Track Selector Navigation Tabs */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Longitudinal Trajectory Center</h2>
            <span className="text-[11px] text-slate-400">({chartData.length} Quarters: 2023Q3 - 2026Q3)</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTrack('cost')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTrack === 'cost'
                  ? 'bg-rose-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Cost Anomaly</span>
            </button>
            <button
              onClick={() => setActiveTrack('duplicate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTrack === 'duplicate'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate Clusters</span>
            </button>
            <button
              onClick={() => setActiveTrack('fund')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTrack === 'fund'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BadgePercent className="w-3.5 h-3.5" />
              <span>Fund & Spend</span>
            </button>
            <button
              onClick={() => setActiveTrack('delay')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTrack === 'delay'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Para 3.12 SLA</span>
            </button>
          </div>
        </div>

        {/* Chart Container */}
        <div className="p-5">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTrack === 'cost' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    unit="%"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine
                    y={1.0}
                    stroke="#e11d48"
                    strokeDasharray="4 4"
                    label={{ value: '1.0% National Baseline', fill: '#fda4af', fontSize: 10, position: 'right' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="costRaw"
                    name="Raw Anomaly Rate (%)"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#f43f5e' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="costSmoothed"
                    name="Empirical Bayes Smoothed (%)"
                    stroke="#fbbf24"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: '#fbbf24' }}
                  />
                </LineChart>
              ) : activeTrack === 'duplicate' ? (
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#818cf8"
                    tick={{ fontSize: 11 }}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#38bdf8"
                    tick={{ fontSize: 11 }}
                    unit="x"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="dupRate"
                    name="Unique Duplicate Work Rate (%)"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#818cf8' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="dupDensity"
                    name="Cluster Density (Works/Cluster)"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#38bdf8' }}
                  />
                </LineChart>
              ) : activeTrack === 'fund' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="fundRate"
                    name="Fund Anomaly Rate (%)"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quarter" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    stroke="#60a5fa"
                    tick={{ fontSize: 11 }}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#94a3b8"
                    tick={{ fontSize: 11 }}
                    unit="d"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <ReferenceLine
                    yAxisId="left"
                    y={100}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: '100% Para 3.12 Statutory Mandate', fill: '#34d399', fontSize: 10, position: 'top' }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="slaComp"
                    name="75-Day SLA Compliance Rate (%)"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#3b82f6' }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="meanDelay"
                    name="Mean Delay (Days to Sanction)"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={{ r: 2, fill: '#94a3b8' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Track Context Caption */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {activeTrack === 'cost' && 'Cost Anomaly: Tracks works with excessive per-unit sanction costs against state work-type median.'}
                {activeTrack === 'duplicate' && 'Duplicate Work: Tracks semantic duplication clusters with high spatial/temporal co-occurrence.'}
                {activeTrack === 'fund' && 'Fund Flow: Detects completed projects with ₹0 spend or stagnant sanctions exceeding statutory lifecycles.'}
                {activeTrack === 'delay' && 'Para 3.12 SLA: Strict 75-calendar-day mandate from MP recommendation to formal administrative sanction.'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Trailing 4-Quarter Rolling Median Baseline Enforced
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
