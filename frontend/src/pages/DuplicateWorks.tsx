import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics';
import type { DuplicatePairItem } from '@/types/duplicate_work';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/Badge';
import { Copy, Filter, GitCompare } from 'lucide-react';

export const DuplicateWorks: React.FC = () => {
  const [items, setItems] = useState<DuplicatePairItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState<string>('');
  const [sameMpOnly, setSameMpOnly] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await analyticsService.getDuplicateWorks({
        page,
        page_size: 20,
        severity: severity || undefined,
        is_same_mp: sameMpOnly ? true : undefined,
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
  }, [page, severity, sameMpOnly]);

  const columns: Column<DuplicatePairItem>[] = [
    {
      header: 'Pair ID',
      accessor: 'id',
      render: (item) => <span className="font-mono text-xs text-slate-500">#{item.id}</span>,
    },
    {
      header: 'Work 1',
      accessor: 'work_id_1',
      render: (item) => (
        <Link
          to={`/works/${encodeURIComponent(item.work_id_1)}`}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline"
        >
          {item.work_id_1}
        </Link>
      ),
    },
    {
      header: 'Work 2',
      accessor: 'work_id_2',
      render: (item) => (
        <Link
          to={`/works/${encodeURIComponent(item.work_id_2)}`}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline"
        >
          {item.work_id_2}
        </Link>
      ),
    },
    {
      header: 'Tier',
      accessor: 'severity',
      render: (item) => <SeverityBadge severity={item.severity} />,
    },
    {
      header: 'Similarity Score',
      accessor: 'duplicate_score',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {(item.duplicate_score * 100).toFixed(1)}%
        </span>
      ),
    },
    {
      header: 'Semantic Match',
      accessor: 'semantic_similarity',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">
          {item.semantic_similarity != null ? `${(item.semantic_similarity * 100).toFixed(1)}%` : '—'}
        </span>
      ),
    },
    {
      header: 'Amount Match',
      accessor: 'amount_similarity',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">
          {item.amount_similarity != null ? `${(item.amount_similarity * 100).toFixed(1)}%` : '—'}
        </span>
      ),
    },
    {
      header: 'Days Apart',
      accessor: 'days_diff',
      render: (item) => (
        <span className="text-xs text-slate-700 font-mono">
          {item.days_diff != null ? `${item.days_diff}d` : '—'}
        </span>
      ),
    },
    {
      header: 'Comparison Action',
      render: (item) => (
        <Link
          to={`/duplicates/compare?id1=${encodeURIComponent(item.work_id_1)}&id2=${encodeURIComponent(item.work_id_2)}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-xs transition-colors"
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Compare</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <Copy className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Model 2 — Potential Duplicate Works</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Semantic transformer embeddings & multi-attribute blocking (temporal, amount, spatial).
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sameMpOnly}
              onChange={(e) => {
                setSameMpOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Same MP Only</span>
          </label>

          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:border-slate-500"
            >
              <option value="">All Tiers</option>
              <option value="HIGH">HIGH (Requires Review)</option>
              <option value="REVIEW">REVIEW</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No duplicate pairs flagged under current criteria."
      />
    </div>
  );
};
