import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { analyticsService } from '@/services/analytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { 
  TrendingUp, 
  AlertTriangle, 
  Copy, 
  BadgePercent, 
  Clock, 
  ShieldAlert, 
  Activity, 
  ExternalLink 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const TrendAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any>(null);
  const [earlyWarnings, setEarlyWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        // Fetch Trends based on role
        if (user.role === 'MINISTRY') {
          const res = await analyticsService.getNationalTrends();
          setTrends(res.quarterly_trends); // Ensure chronological order for charts
          setBenchmarks(res.summary);
        } else if (user.role === 'STATE_OFFICER') {
          const res = await analyticsService.getStateTrends({ state: user.assigned_state || undefined });
          setTrends(res.trends);
          setBenchmarks(res.national_benchmark_quarter);
        } else if (user.role === 'DISTRICT_OFFICER') {
          const res = await analyticsService.getDistrictTrends({ 
            state: user.assigned_state || undefined, 
            district: user.assigned_district || undefined 
          });
          setTrends(res.trends);
          setBenchmarks(res.state_peer_benchmark);
        } else if (user.role === 'MP') {
          const res = await analyticsService.getMPTrends({ mp_name: user.assigned_mp_name || undefined });
          setTrends(res.trends);
          setBenchmarks(res.house_benchmark);
        }

        // Fetch Early Warnings
        const warningsRes = await analyticsService.getEarlyWarnings({ limit: 50 });
        setEarlyWarnings(warningsRes.alerts || []);
        
      } catch (err) {
        console.error("Failed to load trend analytics", err);
        setError("Failed to load trend analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Activity className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">Loading longitudinal trajectories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 text-rose-700 rounded-md border border-rose-200 text-sm">
        {error}
      </div>
    );
  }

  // Format data for Recharts
  const chartData = trends.map(t => {
    // Determine the time label
    const label = t.year_quarter || t.fiscal_year_or_quarter || 'Q?';
    return {
      name: label,
      costRate: (t.cost_anomaly_rate || 0) * 100,
      duplicateRate: (t.duplicate_work_rate || 0) * 100,
      fundRate: (t.fund_anomaly_rate || 0) * 100,
      delayRate: (t.delay_rate || 0) * 100,
    };
  });

  const getRoleHeader = () => {
    switch (user.role) {
      case 'MINISTRY': return "National Macro Trends";
      case 'STATE_OFFICER': return `State Trajectory: ${user.assigned_state}`;
      case 'DISTRICT_OFFICER': return `District Trajectory: ${user.assigned_district}, ${user.assigned_state}`;
      case 'MP': return `MP Portfolio Trajectory: ${user.assigned_mp_name}`;
      default: return "Trend Analytics";
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
          <p className="font-bold text-slate-100 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-semibold">{entry.value.toFixed(3)}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Trend &amp; Aggregate Analytics</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-900 rounded-md border border-purple-200 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {getRoleHeader()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Longitudinal surveillance across 4 independent anomaly models. No composite scoring.
          </p>
        </div>
      </div>

      {/* Trajectory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost Anomaly Trajectory */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-800">Cost Anomaly Rate Trajectory</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="costRate" name="Cost Anomaly Rate" stroke="#e11d48" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duplicate Work Trajectory */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Copy className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Duplicate Work Rate Trajectory</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="duplicateRate" name="Duplicate Rate" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fund Anomaly Trajectory */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BadgePercent className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-800">Fund Anomaly Rate Trajectory</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="fundRate" name="Fund Anomaly Rate" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delay Trajectory */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Statutory Delay Rate Trajectory</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="delayRate" name="Delay Rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Early Warning Queue */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs mt-6">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pre-Breach Early Warning Queue</h2>
              <p className="text-xs text-slate-500">Statutory and statistical predictors flagging works before SLA breach or hard failure</p>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <th className="py-2.5 px-4">Work ID</th>
                <th className="py-2.5 px-4">Warning Type</th>
                <th className="py-2.5 px-4">Paradigm</th>
                <th className="py-2.5 px-4 text-right">Days Elapsed</th>
                <th className="py-2.5 px-4">Urgency</th>
                <th className="py-2.5 px-4">Recommended Action</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earlyWarnings.length > 0 ? (
                earlyWarnings.map((warning, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                      {warning.work_id}
                      <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                        {warning.district}, {warning.state}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {warning.warning_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {warning.paradigm}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {warning.days_elapsed}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                        warning.urgency_level === 'CRITICAL' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {warning.urgency_level}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-[200px] truncate" title={warning.action_recommended}>
                      {warning.action_recommended}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <Link
                        to={`/works/${encodeURIComponent(warning.work_id)}`}
                        className="inline-flex items-center justify-center p-1.5 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-600 transition-colors"
                        title="Inspect Work Dossier"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active early warnings in your jurisdiction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
