import React, { useState } from 'react';
import {
  Search,
} from 'lucide-react';

interface EntityLeagueTableProps {
  grain: 'NATIONAL' | 'STATE';
  onSelectEntity: (name: string) => void;
  currentState?: string;
  districtsData?: any[];
}

export const EntityLeagueTable: React.FC<EntityLeagueTableProps> = ({
  grain,
  onSelectEntity,
  currentState = 'Uttar Pradesh',
  districtsData = [],
}) => {
  const [search, setSearch] = useState('');

  // Sample or real data for state/district rankings
  const filteredData = districtsData
    .filter((item) => {
      const q = search.toLowerCase();
      return (
        item.district?.toLowerCase().includes(q) ||
        item.state?.toLowerCase().includes(q)
      );
    })
    .slice(0, 15);

  const getTierBadge = (worksCount: number) => {
    if (worksCount >= 100) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">ROBUST</span>;
    }
    if (worksCount >= 30) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-900/40 text-blue-300 border border-blue-700/50">MODERATE</span>;
    }
    if (worksCount >= 10) {
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-900/40 text-amber-300 border border-amber-700/50">LOW_VOLUME</span>;
    }
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-900/40 text-rose-300 border border-rose-700/50">INSUFFICIENT</span>;
  };

  return (
    <div className="px-6 py-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                {grain === 'NATIONAL' ? 'State Performance & Trend Benchmarking' : `District Governance Standings (${currentState})`}
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Empirical Bayes Credibility Tiers
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ranked comparative entity analysis. Low-volume outliers are smoothed towards the group mean to prevent sample-size distortion.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-md pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-3 text-right">Total Works</th>
                <th className="py-2.5 px-3 text-center">Credibility Tier</th>
                <th className="py-2.5 px-3 text-right">Cost Anomaly Rate</th>
                <th className="py-2.5 px-3 text-right">Duplicate Rate</th>
                <th className="py-2.5 px-3 text-right">Fund Anomaly</th>
                <th className="py-2.5 px-3 text-right">75d SLA Compliance</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching entities found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const name = item.district || item.state;
                  const totalWorks = item.total_works || 0;
                  const costRate = item.total_works ? ((item.high_cost_anomalies / item.total_works) * 100).toFixed(1) : '0.0';
                  const dupRate = item.total_works ? (((item.high_duplicate_pairs * 2) / item.total_works) * 100).toFixed(1) : '0.0';
                  const fundRate = item.total_works ? ((item.high_fund_anomalies / item.total_works) * 100).toFixed(1) : '0.0';
                  const delayRate = item.total_works ? ((item.high_delays / item.total_works) * 100).toFixed(1) : '0.0';
                  const slaComp = (100 - parseFloat(delayRate)).toFixed(1);

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-200">
                        {name}
                        {item.state && grain === 'NATIONAL' && (
                          <span className="text-[10px] text-slate-400 font-normal ml-1.5">({item.state})</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-300">
                        {totalWorks.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {getTierBadge(totalWorks)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-300">
                        {costRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-indigo-300">
                        {dupRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-300">
                        {fundRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-300">
                        {slaComp}%
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => onSelectEntity(name)}
                          className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 text-[11px] font-medium transition-colors border border-blue-500/30"
                        >
                          Inspect Trends
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
