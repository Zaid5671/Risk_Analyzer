import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics';
import type { FundAnomalyItem } from '@/types/fund_anomaly';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge, Badge } from '@/components/common/Badge';
import { BadgePercent, Filter, ExternalLink } from 'lucide-react';

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
      header: 'Audit Category',
      accessor: 'audit_category',
      render: (item) => (
        <Badge variant="neutral" size="sm">
          {item.audit_category.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      header: 'Disbursed Amount',
      accessor: 'total_disbursed_amount',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-800">
          {item.total_disbursed_amount != null ? `₹${item.total_disbursed_amount.toLocaleString()}` : '₹0'}
        </span>
      ),
    },
    {
      header: 'Utilization',
      accessor: 'utilization_ratio',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700">
          {item.utilization_ratio != null ? `${(item.utilization_ratio * 100).toFixed(1)}%` : '—'}
        </span>
      ),
    },
    {
      header: 'Vendor HHI',
      accessor: 'payment_concentration_hhi',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700" title="Herfindahl-Hirschman Index">
          {item.payment_concentration_hhi != null ? item.payment_concentration_hhi.toFixed(3) : '—'}
        </span>
      ),
    },
    {
      header: 'Score',
      accessor: 'fund_anomaly_score',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {(item.fund_anomaly_score * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      header: 'Audit Explanation',
      accessor: 'explanation',
      className: 'max-w-xs',
      render: (item) => (
        <p className="text-xs text-slate-600 line-clamp-2" title={item.explanation || ''}>
          {item.explanation || 'Financial pattern verified against normal ledger flow.'}
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
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <BadgePercent className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Model 3 — Fund & Expenditure Anomaly</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Financial reconciliation, vendor payment concentration (HHI), and disbursement dormancy.
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
