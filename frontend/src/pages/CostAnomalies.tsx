import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import type { CostAnomalyItem } from '@/types/cost_anomaly';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/Badge';
import { AlertTriangle, Filter } from 'lucide-react';
import { WorkCell, ReasonCell } from '@/components/common/WorkCell';
import { formatINRCompact, formatNumber } from '@/lib/format';

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
      header: 'Work',
      render: (item) => <WorkCell workId={item.work_id} work={item.work_info} />,
    },
    {
      header: 'Why flagged',
      className: 'min-w-[260px]',
      render: (item) => (
        <div className="max-w-md">
          {item.cost_ratio_vs_peer_median ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tabular-nums text-rose-700">
                {item.cost_ratio_vs_peer_median.toFixed(1)}×
              </span>
              <span className="text-[11px] text-slate-500">the typical cost</span>
            </div>
          ) : null}
          <ReasonCell reason={item.reason} fallback={item.explanation} />
          {item.peer_group_size ? (
            <div className="text-[10.5px] text-slate-400 mt-0.5">
              Compared with {formatNumber(item.peer_group_size)} similar works
            </div>
          ) : null}
        </div>
      ),
    },
    {
      header: 'Sanctioned',
      className: 'text-right whitespace-nowrap',
      render: (item) => (
        <span className="text-xs font-semibold tabular-nums text-slate-800">
          {formatINRCompact(item.work_info?.sanction_amount)}
        </span>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (item) => <SeverityBadge severity={item.severity} />,
    },
    {
      header: 'Score',
      accessor: 'cost_anomaly_score',
      className: 'text-right',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {(item.cost_anomaly_score * 100).toFixed(1)}%
        </span>
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
            <h1 className="text-xl font-bold text-slate-900">Cost Anomaly Detection</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Works whose sanctioned cost is far from similar works in the same state (or nationally when a state has too few).
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
