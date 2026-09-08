import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { worksService } from '@/services/works';
import type { WorkListItem } from '@/types/work';
import type { PaginationMeta, FilterOptionsResponse } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { Badge } from '@/components/common/Badge';
import { FolderKanban, Search, ExternalLink } from 'lucide-react';

export const WorksRegistry: React.FC = () => {
  const [works, setWorks] = useState<WorkListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [filterMeta, setFilterMeta] = useState<FilterOptionsResponse | null>(null);

  useEffect(() => {
    worksService.getFilters().then(setFilterMeta).catch(console.error);
  }, []);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const res = await worksService.getWorks({
        page,
        page_size: 20,
        search: search || undefined,
        work_category: category || undefined,
        work_status: status || undefined,
      });
      setWorks(res.items);
      setPagination(res.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(loadWorks, 250);
    return () => clearTimeout(timeout);
  }, [page, search, category, status]);

  const columns: Column<WorkListItem>[] = [
    {
      header: 'Work ID',
      accessor: 'work_id',
      render: (item) => (
        <Link
          to={`/works/${encodeURIComponent(item.work_id)}`}
          className="font-mono text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          <span>{item.work_id}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
    {
      header: 'Category',
      accessor: 'work_category',
      render: (item) => <span className="text-xs text-slate-700 font-medium">{item.work_category || 'General'}</span>,
    },
    {
      header: 'State / District',
      render: (item) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{item.district || '—'}</p>
          <p className="text-[10px] text-slate-500">{item.state || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Sanction Outlay',
      accessor: 'sanction_amount',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-900">
          {item.sanction_amount != null ? `₹${item.sanction_amount.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      header: 'Disbursed',
      accessor: 'amount_disbursed',
      render: (item) => (
        <span className="font-mono text-xs text-slate-600">
          {item.amount_disbursed != null ? `₹${item.amount_disbursed.toLocaleString()}` : '₹0'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'work_status',
      render: (item) => {
        const isComp = item.is_completed_flag;
        return (
          <Badge variant={isComp ? 'success' : 'info'} size="sm">
            {item.work_status || 'In Progress'}
          </Badge>
        );
      },
    },
    {
      header: 'Implementing Agency',
      accessor: 'ida',
      render: (item) => <span className="text-xs text-slate-600 line-clamp-1">{item.ida || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-900 text-white">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Master Works Registry</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete searchable repository of sanctioned works within your administrative jurisdiction.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search Work ID or description..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filters:</span>

        {/* Category Dropdown */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-slate-50 text-slate-700 font-medium focus:outline-none"
        >
          <option value="">All Categories</option>
          {filterMeta?.work_categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 bg-slate-50 text-slate-700 font-medium focus:outline-none"
        >
          <option value="">All Statuses</option>
          {filterMeta?.work_statuses.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {(category || status || search) && (
          <button
            onClick={() => {
              setCategory('');
              setStatus('');
              setSearch('');
              setPage(1);
            }}
            className="text-xs text-blue-600 hover:underline ml-auto font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={works}
        keyExtractor={(item) => item.work_id}
        isLoading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No works found in this jurisdiction matching your search/filters."
      />
    </div>
  );
};
