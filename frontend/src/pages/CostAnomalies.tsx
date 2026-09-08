import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics';
import type { CostAnomalyItem } from '@/types/cost_anomaly';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/Badge';
import { AlertTriangle, Filter, ExternalLink } from 'lucide-react';

export const CostAnomalies: React.FC = () => {
  const [items, setItems] = useState<CostAnomalyItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getCostAnomalies({
        page,
        page_size: 20,
        severity: severity || undefined,
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, severity]);

  const columns: Column<CostAnomalyItem>[] = [
    {
      header: 'Work ID',
      accessor: 'work_id',
      render: (item) => (
        <Link
          to={`/works/${encodeURIComponent(item.work_id)}`}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
        >
          <span>{item.work_id}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (item) => <SeverityBadge severity={item.severity} />,
    },
    {
      header: 'Calibrated Score',
      accessor: 'cost_anomaly_score',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {(item.cost_anomaly_score * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      header: 'Peer Group Used',
      accessor: 'peer_group_used',
      render: (item) => (
        <span className="text-xs text-slate-600">
          {item.peer_group_used || 'General Peer Group'} ({item.peer_group_level || 'L1'})
        </span>
      ),
    },
    {
      header: 'Peer Sample Size',
      accessor: 'peer_group_size',
      render: (item) => (
        <span className="text-xs text-slate-600 font-mono">
          {item.peer_group_size ? item.peer_group_size.toLocaleString() : '—'}
        </span>
      ),
    },
    {
      header: 'Statutory Explanation',
      accessor: 'explanation',
      className: 'max-w-md',
      render: (item) => (
        <p className="text-xs text-slate-600 line-clamp-2" title={item.explanation || ''}>
          {item.explanation || 'Evaluated against category peer median.'}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Model 1 — Cost Anomaly Detection</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hierarchical Isolation Forest & peer median deviation calibrated by work category.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:border-slate-500"
          >
            <option value="">All Severities</option>
            <option value="HIGH">HIGH (Requires Review)</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.work_id}
        isLoading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No cost anomalies found matching the selected criteria."
      />
    </div>
  );
};
