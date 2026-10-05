import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/services/analytics';
import type { FundAnomalyItem } from '@/types/fund_anomaly';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge, Badge } from '@/components/common/Badge';
import { BadgePercent, Filter } from 'lucide-react';
import { WorkCell, ReasonCell } from '@/components/common/WorkCell';
import { formatINRCompact } from '@/lib/format';

const CATEGORY_LABELS: Record<string, string> = {
  ACTIVE_EXPENDITURE: 'Spending in progress',
  NORMAL_AWAITING_DISBURSEMENT: 'Awaiting first payment',
  DORMANT_SANCTION: 'Dormant — nothing spent in a year',
  STATUS_EXPENDITURE_MISMATCH: 'Status vs payments mismatch',
};

export const FundAnomalies: React.FC = () => {
  const [items, setItems] = useState<FundAnomalyItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<string>('');
  const [category, setCategory] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getFundAnomalies({
        page,
        page_size: 20,
        severity: severity || undefined,
        audit_category: category || undefined,
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
  }, [page, severity, category]);

  const columns: Column<FundAnomalyItem>[] = [
    {
      header: 'Work',
      render: (item) => <WorkCell workId={item.work_id} work={item.work_info} />,
    },
    {
      header: 'Why flagged',
      className: 'min-w-[240px]',
      render: (item) => (
        <div className="space-y-1">
          <Badge variant="neutral" size="sm">{CATEGORY_LABELS[item.audit_category] || item.audit_category}</Badge>
          <ReasonCell reason={item.reason} fallback={item.explanation} />
        </div>
      ),
    },
    {
      header: 'Spent',
      className: 'text-right whitespace-nowrap',
      render: (item) => (
        <div className="text-xs tabular-nums">
          <div className="font-semibold text-slate-800">{formatINRCompact(item.total_disbursed_amount ?? 0)}</div>
          <div className="text-[11px] text-slate-500">
            of {formatINRCompact(item.work_info?.sanction_amount)}
            {item.utilization_ratio != null ? ` · ${(item.utilization_ratio * 100).toFixed(0)}%` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (item) => <SeverityBadge severity={item.severity} />,
    },
    {
      header: 'Score',
      accessor: 'fund_anomaly_score',
      className: 'text-right',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {(item.fund_anomaly_score * 100).toFixed(1)}%
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
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <BadgePercent className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Fund & Expenditure Audit</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Unusual payment timing and size, money that never moved, and works marked done with no payments.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:border-slate-500"
          >
            <option value="">All Categories</option>
            <option value="ACTIVE_EXPENDITURE">Active Expenditure</option>
            <option value="NORMAL_AWAITING_DISBURSEMENT">Awaiting Disbursement</option>
            <option value="DORMANT_SANCTION">Dormant Sanction</option>
            <option value="STATUS_EXPENDITURE_MISMATCH">Status Mismatch</option>
          </select>

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
        emptyMessage="No fund & expenditure anomalies found matching criteria."
      />
    </div>
  );
};
