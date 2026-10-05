import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { analyticsService } from '@/services/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Copy,
  BadgePercent,
  Clock,
  ShieldAlert,
  Activity,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { EarlyWarningItem } from '@/types/trends';
import { formatNumber, titleCase } from '@/lib/format';

// Last date covered by the portal extract (same fixed reference date the backend uses)
const DATA_REFERENCE_DATE = new Date('2026-09-05');
const WARNINGS_PAGE_SIZE = 10;

/** "2026Q3" -> true when that quarter had not finished by the data's reference date. */
const isPartialQuarter = (label: string): boolean => {
  const m = /^(\d{4})\s*-?\s*Q([1-4])$/i.exec(label.trim());
  if (!m) return false;
  const quarterEnd = new Date(Number(m[1]), Number(m[2]) * 3, 0); // last day of the quarter
  return quarterEnd > DATA_REFERENCE_DATE;
};

const SERIES = [
  { key: 'costRate', title: 'Cost anomaly rate', color: '#e11d48', icon: AlertTriangle, iconColor: 'text-rose-600' },
  { key: 'duplicateRate', title: 'Duplicate work rate', color: '#4f46e5', icon: Copy, iconColor: 'text-indigo-600' },
  { key: 'fundRate', title: 'Fund anomaly rate', color: '#d97706', icon: BadgePercent, iconColor: 'text-amber-600' },
  { key: 'delayRate', title: 'Statutory delay rate', color: '#2563eb', icon: Clock, iconColor: 'text-blue-600' },
] as const;

type SeriesKey = (typeof SERIES)[number]['key'];

export const TrendAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [warnings, setWarnings] = useState<EarlyWarningItem[]>([]);
  const [warningTotals, setWarningTotals] = useState({ total: 0, critical: 0, watchlist: 0 });
  const [warningPage, setWarningPage] = useState(1);
  const [warningsLoading, setWarningsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        if (user.role === 'MINISTRY') {
          const res = await analyticsService.getNationalTrends();
          setTrends(res.quarterly_trends);
        } else if (user.role === 'STATE_OFFICER') {
          const res = await analyticsService.getStateTrends({ state: user.assigned_state || undefined });
          setTrends(res.trends);
        } else if (user.role === 'DISTRICT_OFFICER') {
          const res = await analyticsService.getDistrictTrends({
            state: user.assigned_state || undefined,
            district: user.assigned_district || undefined,
          });
          setTrends(res.trends);
        } else if (user.role === 'MP') {
          const res = await analyticsService.getMPTrends({ mp_name: user.assigned_mp_name || undefined });
          setTrends(res.trends);
        }
      } catch (err) {
        console.error('Failed to load trend analytics', err);
        setError('Failed to load trend analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setWarningsLoading(true);
    analyticsService
      .getEarlyWarnings({ limit: WARNINGS_PAGE_SIZE, offset: (warningPage - 1) * WARNINGS_PAGE_SIZE })
      .then((res) => {
        setWarnings(res.alerts || []);
        setWarningTotals({ total: res.total_alerts, critical: res.critical_count, watchlist: res.watchlist_count });
      })
      .catch((err) => console.error('Failed to load early warnings', err))
      .finally(() => setWarningsLoading(false));
  }, [user, warningPage]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Activity className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">Loading trends...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-rose-50 text-rose-700 rounded-md border border-rose-200 text-sm">{error}</div>;
  }

  // The latest quarter is often still in progress: draw it as a separate dashed segment
  const labels = trends.map((t) => String(t.year_quarter || t.fiscal_year_or_quarter || 'Q?'));
  const lastIdx = labels.length - 1;
  const lastIsPartial = lastIdx > 0 && isPartialQuarter(labels[lastIdx]);
  const chartData = trends.map((t, i) => {
    const point: Record<string, string | number | null> = { name: labels[i] };
    const values: Record<SeriesKey, number> = {
      costRate: (t.cost_anomaly_rate || 0) * 100,
      duplicateRate: (t.duplicate_work_rate || 0) * 100,
      fundRate: (t.fund_anomaly_rate || 0) * 100,
      delayRate: (t.delay_rate || 0) * 100,
    };
    for (const { key } of SERIES) {
      point[key] = !lastIsPartial || i < lastIdx ? values[key] : null;
      point[`${key}Partial`] = lastIsPartial && i >= lastIdx - 1 ? values[key] : null;
    }
    return point;
  });

  const roleHeader = (() => {
    switch (user.role) {
      case 'MINISTRY':
        return 'National';
      case 'STATE_OFFICER':
        return user.assigned_state;
      case 'DISTRICT_OFFICER':
        return `${titleCase(user.assigned_district)}, ${user.assigned_state}`;
      case 'MP':
        return `MP ${titleCase(user.assigned_mp_name)}`;
      default:
        return 'Trends';
    }
  })();

  const TrendTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = payload.find((p: any) => p.value != null);
    if (!entry) return null;
    return (
      <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-xl border border-slate-700">
        <p className="font-bold text-slate-100">
          {label}
          {lastIsPartial && label === labels[lastIdx] ? ' (in progress)' : ''}
        </p>
        <p className="mt-1 font-semibold tabular-nums">{Number(entry.value).toFixed(2)}%</p>
      </div>
    );
  };

  const totalPages = Math.max(1, Math.ceil(warningTotals.total / WARNINGS_PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Trends &amp; Early Warnings</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-900 rounded-md border border-purple-200 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {roleHeader}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            How each kind of risk has moved quarter by quarter.
            {lastIsPartial && ` ${labels[lastIdx]} is still in progress — data runs to 5 Sep 2026.`}
          </p>
        </div>
      </div>

      {/* Trend grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SERIES.map(({ key, title, color, icon: Icon, iconColor }) => (
          <div key={key} className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Icon className={`w-4 h-4 ${iconColor}`} />
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 16, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  {lastIsPartial && (
                    <ReferenceArea
                      x1={labels[lastIdx - 1]}
                      x2={labels[lastIdx]}
                      fill="#f8fafc"
                      label={{ value: 'in progress', position: 'insideTopRight', fontSize: 10, fill: '#64748b' }}
                    />
                  )}
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip content={<TrendTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: color, stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  {lastIsPartial && (
                    <Line
                      type="monotone"
                      dataKey={`${key}Partial`}
                      stroke={color}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={(props: any) =>
                        props.index === lastIdx ? (
                          <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill="#fff" stroke={color} strokeWidth={2} />
                        ) : (
                          <g key={props.index} />
                        )
                      }
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Early warnings */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-purple-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Early warnings — act before the deadline</h2>
            <p className="text-xs text-slate-500">
              {formatNumber(warningTotals.critical)} critical · {formatNumber(warningTotals.watchlist)} on watch · most
              urgent first
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-4">Work</th>
                <th className="py-2.5 px-4">Warning</th>
                <th className="py-2.5 px-4">Urgency</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">Deadline in</th>
                <th className="py-2.5 px-4">What to do</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warningsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="py-3 px-4">
                      <div className="h-3.5 bg-slate-200/70 rounded w-2/3" />
                    </td>
                  </tr>
                ))
              ) : warnings.length > 0 ? (
                warnings.map((w) => (
                  <tr key={`${w.work_id}-${w.warning_type}`} className="hover:bg-slate-50/80 transition-colors align-top">
                    <td className="py-3 px-4 min-w-[240px] max-w-sm">
                      <Link
                        to={`/works/${encodeURIComponent(w.work_id)}`}
                        className="font-semibold text-[13px] text-slate-900 hover:text-blue-700 hover:underline line-clamp-2"
                        title={w.work_description || w.work_id}
                      >
                        {w.work_description ? titleCase(w.work_description) : w.work_id}
                      </Link>
                      <span className="block text-[11px] text-slate-500 mt-0.5">
                        {titleCase(w.district)}, {w.state} · <span className="font-mono">{w.work_id}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800">{titleCase(w.warning_type.replace(/_/g, ' '))}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                          w.urgency_level === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {w.urgency_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold tabular-nums text-slate-800 whitespace-nowrap">
                      {w.days_to_statutory_breach != null
                        ? `${w.days_to_statutory_breach} ${w.days_to_statutory_breach === 1 ? 'day' : 'days'}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 min-w-[260px] max-w-md leading-snug">{w.action_recommended}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/works/${encodeURIComponent(w.work_id)}`}
                        className="inline-flex items-center justify-center p-1.5 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 transition-colors"
                        title="Open full profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No active early warnings in your jurisdiction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="py-2.5 px-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
          <span className="tabular-nums">
            {warningTotals.total > 0
              ? `Showing ${formatNumber((warningPage - 1) * WARNINGS_PAGE_SIZE + 1)}–${formatNumber(
                  Math.min(warningPage * WARNINGS_PAGE_SIZE, warningTotals.total)
                )} of ${formatNumber(warningTotals.total)}`
              : 'No warnings'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWarningPage((p) => p - 1)}
              disabled={warningPage <= 1 || warningsLoading}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium tabular-nums">
              {formatNumber(warningPage)} / {formatNumber(totalPages)}
            </span>
            <button
              onClick={() => setWarningPage((p) => p + 1)}
              disabled={warningPage >= totalPages || warningsLoading}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
