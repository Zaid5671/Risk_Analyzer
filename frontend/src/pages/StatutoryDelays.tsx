import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import type { DelayItem } from '@/types/delay';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/Badge';
import { Clock, Filter, Info } from 'lucide-react';
import { WorkCell, ReasonCell } from '@/components/common/WorkCell';

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
      header: 'Work',
      render: (item) => <WorkCell workId={item.work_id} work={item.work_info} />,
    },
    {
      header: 'Why flagged',
      className: 'min-w-[240px]',
      render: (item) => <ReasonCell reason={item.reason} fallback={item.explanation} />,
    },
    {
      header: 'Sanction (limit 75d)',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="text-xs tabular-nums">
          <span className="font-semibold">{item.rec_to_sanc_days != null ? `${item.rec_to_sanc_days}d` : '—'}</span>
          {item.rec_to_sanc_delay_days != null && item.rec_to_sanc_delay_days > 0 && (
            <span className="text-rose-600 font-semibold ml-1.5">+{item.rec_to_sanc_delay_days}d</span>
          )}
        </div>
      ),
    },
    {
      header: 'Completion (limit 365d)',
      className: 'whitespace-nowrap',
      render: (item) => {
        const done = item.sanc_to_comp_days != null;
        const days = done ? item.sanc_to_comp_days : item.open_work_aging_days;
        const over = done ? item.sanc_to_comp_delay_days : item.open_work_overdue_days;
        return (
          <div className="text-xs tabular-nums">
            <span className="font-semibold">{days != null ? `${days}d` : '—'}</span>
            {over != null && over > 0 && <span className="text-rose-600 font-semibold ml-1.5">+{over}d</span>}
            <div className="text-[11px] text-slate-500">{done ? 'completed' : 'still open'}</div>
          </div>
        );
      },
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (item) => <SeverityBadge severity={item.severity} />,
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
            <h1 className="text-xl font-bold text-slate-900">Statutory Delay Tracking</h1>
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
