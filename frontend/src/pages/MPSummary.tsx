import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import type { MPSummaryItem } from '@/types/summaries';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Users, Filter } from 'lucide-react';

export const MPSummary: React.FC = () => {
  const [items, setItems] = useState<MPSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [houseFilter, setHouseFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getMPSummaries({
        house: houseFilter || undefined,
      });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [houseFilter]);

  const columns: Column<MPSummaryItem>[] = [
    {
      header: 'Member of Parliament',
      accessor: 'mp_name',
      render: (item) => <span className="font-bold text-slate-900">{item.mp_name}</span>,
    },
    {
      header: 'House',
      accessor: 'house',
      render: (item) => (
        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">{item.house}</span>
      ),
    },
    {
      header: 'Constituency / State',
      render: (item) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{item.constituency || '—'}</p>
          <p className="text-[10px] text-slate-500">{item.state}</p>
        </div>
      ),
    },
    {
      header: 'Works',
      accessor: 'total_works',
      render: (item) => <span className="font-mono text-slate-800">{item.total_works.toLocaleString()}</span>,
    },
    {
      header: 'Sanction Outlay',
      accessor: 'total_sanctioned_amount',
      render: (item) => (
        <span className="font-mono font-semibold text-slate-900">
          ₹{(item.total_sanctioned_amount / 1e7).toFixed(2)} Cr
        </span>
      ),
    },
    {
      header: 'Completion Rate',
      accessor: 'completion_rate',
      render: (item) => (
        <span className="font-mono font-bold text-emerald-700">{(item.completion_rate * 100).toFixed(1)}%</span>
      ),
    },
    {
      header: 'HIGH Cost',
      accessor: 'high_cost_anomalies',
      render: (item) => (
        <span
          className={`font-mono font-bold ${
            item.high_cost_anomalies > 0 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-slate-400'
          }`}
        >
          {item.high_cost_anomalies}
        </span>
      ),
    },
    {
      header: 'HIGH Fund',
      accessor: 'high_fund_anomalies',
      render: (item) => (
        <span
          className={`font-mono font-bold ${
            item.high_fund_anomalies > 0 ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded' : 'text-slate-400'
          }`}
        >
          {item.high_fund_anomalies}
        </span>
      ),
    },
    {
      header: 'HIGH Delays',
      accessor: 'high_delays',
      render: (item) => (
        <span
          className={`font-mono font-bold ${
            item.high_delays > 0 ? 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded' : 'text-slate-400'
          }`}
        >
          {item.high_delays}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">MP Portfolio Governance Summary</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Constituency-level portfolio tracking, completion rates, and statutory anomaly distributions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={houseFilter}
            onChange={(e) => setHouseFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none"
          >
            <option value="">All Houses</option>
            <option value="Lok Sabha">Lok Sabha</option>
            <option value="Rajya Sabha">Rajya Sabha</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => `${item.mp_name}-${item.state}`}
        isLoading={loading}
        emptyMessage="No MP summary records found."
      />
    </div>
  );
};
