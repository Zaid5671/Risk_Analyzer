import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics';
import type { DelayItem } from '@/types/delay';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/Badge';
import { Clock, Filter, ExternalLink, Info } from 'lucide-react';

export const StatutoryDelays: React.FC = () => {
  const [items, setItems] = useState<DelayItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getDelays({
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

  const columns: Column<DelayItem>[] = [
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
      header: 'Overall Severity',
      accessor: 'severity',
      render: (item) => <SeverityBadge severity={item.severity} />,
    },
    {
      header: 'Sanction SLA (75d)',
      render: (item) => (
        <div className="text-xs">
          <span className="font-mono font-semibold">
            {item.rec_to_sanc_days != null ? `${item.rec_to_sanc_days}d` : '—'}
          </span>
          {item.rec_to_sanc_delay_days != null && item.rec_to_sanc_delay_days > 0 && (
            <span className="text-rose-600 font-bold ml-1.5">(+{item.rec_to_sanc_delay_days}d overdue)</span>
          )}
        </div>
      ),
    },
    {
      header: 'Completion SLA (365d)',
      render: (item) => (
        <div className="text-xs">
          <span className="font-mono font-semibold">
            {item.sanc_to_comp_days != null ? `${item.sanc_to_comp_days}d` : '—'}
          </span>
          {item.sanc_to_comp_delay_days != null && item.sanc_to_comp_delay_days > 0 && (
            <span className="text-rose-600 font-bold ml-1.5">(+{item.sanc_to_comp_delay_days}d)</span>
          )}
        </div>
      ),
    },
    {
      header: 'Open Aging Days',
      accessor: 'open_work_aging_days',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">
          {item.open_work_aging_days != null ? `${item.open_work_aging_days}d` : '—'}
        </span>
      ),
    },
    {
      header: 'Overdue Past 1yr',
      accessor: 'open_work_overdue_days',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold ${
            item.open_work_overdue_days && item.open_work_overdue_days > 0 ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          {item.open_work_overdue_days != null ? `${item.open_work_overdue_days}d` : '0d'}
        </span>
      ),
    },
    {
      header: 'Statutory Explanation',
      accessor: 'explanation',
      className: 'max-w-md',
      render: (item) => (
        <p className="text-xs text-slate-600 line-clamp-2" title={item.explanation || ''}>
          {item.explanation || 'Compliance tracking against MPLADS Guidelines 2023.'}
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
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Model 4 — Statutory Delay & SLA Tracking</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking compliance with official statutory deadlines under MPLADS Guidelines 2023 Para 3.12.
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
            <option value="HIGH">HIGH (Severe Delay)</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>
      </div>

      {/* Statutory SLA Policy Banner */}
      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Official Statutory SLA Thresholds (MPLADS Guidelines 2023 Para 3.12):</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
            <div className="bg-white/80 p-2 rounded border border-blue-100">
              <span className="font-semibold text-slate-800">Recommendation → Sanction:</span>{' '}
              <strong className="text-blue-700">75 Days</strong>
            </div>
            <div className="bg-white/80 p-2 rounded border border-blue-100">
              <span className="font-semibold text-slate-800">Execution Guideline:</span>{' '}
              <strong className="text-blue-700">365 Days (1 Year)</strong>
            </div>
            <div className="bg-white/80 p-2 rounded border border-blue-100 opacity-75">
              <span className="font-semibold text-slate-800">Rejection Notice (45d):</span>{' '}
              <span className="italic text-slate-600">Unrecorded in Portal Data</span>
            </div>
          </div>
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
        emptyMessage="No statutory delays flagged under current filters."
      />
    </div>
  );
};
