import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import type { DistrictSummaryItem } from '@/types/summaries';
import { DataTable, type Column } from '@/components/common/DataTable';
import { MapPin, Filter } from 'lucide-react';

export const DistrictSummary: React.FC = () => {
  const [items, setItems] = useState<DistrictSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getDistrictSummaries({
        state: stateFilter || undefined,
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
  }, [stateFilter]);

  const columns: Column<DistrictSummaryItem>[] = [
    {
      header: 'District',
      accessor: 'district',
      render: (item) => <span className="font-bold text-slate-900">{item.district}</span>,
    },
    {
      header: 'State',
      accessor: 'state',
      render: (item) => <span className="text-slate-600">{item.state}</span>,
    },
    {
      header: 'Total Works',
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
      header: 'Disbursed',
      accessor: 'total_disbursed_amount',
      render: (item) => (
        <span className="font-mono text-slate-700">₹{(item.total_disbursed_amount / 1e7).toFixed(2)} Cr</span>
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
      header: 'HIGH Duplicate',
      accessor: 'high_duplicate_pairs',
      render: (item) => (
        <span
          className={`font-mono font-bold ${
            item.high_duplicate_pairs > 0 ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded' : 'text-slate-400'
          }`}
        >
          {item.high_duplicate_pairs}
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
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">District Governance Performance Summary</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated financial outlay, disbursement, and independent audit findings across administrative districts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            placeholder="Filter by state name..."
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => `${item.state}-${item.district}`}
        isLoading={loading}
        emptyMessage="No district summary records found."
      />
    </div>
  );
};
