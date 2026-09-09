import React, { useState, useEffect, useMemo } from 'react';
import { analyticsService } from '@/services/analytics';
import { useAuth } from '@/context/AuthContext';
import type { MPSummaryItem } from '@/types/summaries';
import { DataTable, type Column } from '@/components/common/DataTable';
import {
  Users,
  Search,
  X,
  Filter,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Database,
  ShieldAlert,
  Landmark,
} from 'lucide-react';

type SortField =
  | 'mp_name'
  | 'house'
  | 'state'
  | 'total_works'
  | 'total_sanctioned_amount'
  | 'completion_rate'
  | 'high_cost_anomalies'
  | 'high_fund_anomalies'
  | 'high_delays';

type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 20;

export const MPSummary: React.FC = () => {
  const { user } = useAuth();

  // Raw complete dataset
  const [allMPs, setAllMPs] = useState<MPSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [houseFilter, setHouseFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting state (default: total_works descending)
  const [sortField, setSortField] = useState<SortField>('total_works');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Load complete MP dataset guaranteeing 100% coverage (all 714 MPs)
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user?.role === 'STATE_OFFICER' || user?.role === 'DISTRICT_OFFICER' || user?.role === 'MP') {
        // Scoped roles have fewer than 500 MPs in jurisdiction (e.g. UP has ~111 MPs)
        const scopedData = await analyticsService.getMPSummaries({ limit: 500 });
        setAllMPs(scopedData);
      } else {
        // Central Ministry / National Oversight:
        // Base query fetches top 500 MPs; parallel partition queries fetch remainder to ensure all 714 MPs are present
        const partitionLetters = ['e', 'o', 'u', 'd', 'm', 'k', 't', 'l', 'g', 'v'];
        const allQueries = ['', ...partitionLetters];
        const results: MPSummaryItem[][] = [];

        // Batch in groups of 4 to stay well within connection pool limits
        const chunkSize = 4;
        for (let i = 0; i < allQueries.length; i += chunkSize) {
          const chunk = allQueries.slice(i, i + chunkSize);
          const chunkRes = await Promise.all(
            chunk.map((q) => analyticsService.getMPSummaries({ mp_name: q || undefined, limit: 500 }))
          );
          results.push(...chunkRes);
        }

        // Deduplicate by mp_name
        const uniqueMap = new Map<string, MPSummaryItem>();
        results.forEach((list) => {
          list.forEach((item) => {
            const key = item.mp_name.trim().toLowerCase();
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, item);
            }
          });
        });

        const completeList = Array.from(uniqueMap.values());
        setAllMPs(completeList);
      }
    } catch (err: any) {
      console.error('Failed to load MP summary records:', err);
      setError('Failed to load complete parliamentary member data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Reset pagination to page 1 whenever search query or house filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, houseFilter]);

  // Handle column header click for interactive sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to ascending for text columns, descending for numerical metrics
      setSortDir(field === 'mp_name' || field === 'house' || field === 'state' ? 'asc' : 'desc');
    }
  };

  // Pipeline Step 1 & 2: Filter by House + Search Query across MP Name
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allMPs.filter((item) => {
      // House filter (Lok Sabha / Rajya Sabha)
      if (houseFilter && item.house !== houseFilter) {
        return false;
      }

      // MP name search (case-insensitive, partial-match)
      if (q && !item.mp_name.toLowerCase().includes(q)) {
        return false;
      }

      return true;
    });
  }, [allMPs, houseFilter, searchQuery]);

  // Pipeline Step 3: Sort filtered items (Strictly natural metrics - zero composite risk scoring)
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      }

      const numA = Number(aVal) || 0;
      const numB = Number(bVal) || 0;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });
  }, [filteredItems, sortField, sortDir]);

  // Pipeline Step 4: Paginate (20 entries per page)
  const totalMatching = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalMatching / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedItems.slice(start, start + PAGE_SIZE);
  }, [sortedItems, safePage]);

  // Pagination metadata for DataTable
  const paginationMeta = useMemo(() => {
    return {
      total_records: totalMatching,
      page: safePage,
      page_size: PAGE_SIZE,
      total_pages: totalPages,
      has_next: safePage < totalPages,
      has_prev: safePage > 1,
    };
  }, [totalMatching, safePage, totalPages]);

  // Counts by House in master dataset
  const { lokSabhaCount, rajyaSabhaCount } = useMemo(() => {
    let ls = 0;
    let rs = 0;
    allMPs.forEach((m) => {
      if (m.house === 'Lok Sabha') ls++;
      else if (m.house === 'Rajya Sabha') rs++;
    });
    return { lokSabhaCount: ls, rajyaSabhaCount: rs };
  }, [allMPs]);

  // Helper to render interactive sortable column header
  const renderSortHeader = (label: string, field: SortField) => {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 hover:text-blue-900 transition-colors group cursor-pointer select-none text-left whitespace-nowrap"
        title={`Sort by ${label} (${isActive ? (sortDir === 'asc' ? 'Ascending' : 'Descending') : 'Click to sort'})`}
      >
        <span>{label}</span>
        <span className="inline-flex items-center">
          {isActive ? (
            sortDir === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-blue-700 stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-blue-700 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    );
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Member of Parliament',
      'House',
      'Constituency',
      'State',
      'Total Works',
      'Sanction Outlay (INR)',
      'Completed Works',
      'Completion Rate (%)',
      'High Cost Anomalies',
      'High Fund Anomalies',
      'High Delays',
    ];
    const rows = sortedItems.map((d) => [
      `"${d.mp_name.replace(/"/g, '""')}"`,
      `"${d.house.replace(/"/g, '""')}"`,
      `"${(d.constituency || '—').replace(/"/g, '""')}"`,
      `"${(d.state || '—').replace(/"/g, '""')}"`,
      d.total_works,
      d.total_sanctioned_amount,
      d.completed_works,
      d.completion_rate,
      d.high_cost_anomalies,
      d.high_fund_anomalies,
      d.high_delays,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mp_portfolio_governance_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 9 Columns preserved exactly with natural values and styling
  const columns: Column<MPSummaryItem>[] = [
    {
      header: renderSortHeader('Member of Parliament', 'mp_name'),
      accessor: 'mp_name',
      render: (item) => (
        <span className="font-bold text-slate-900 tracking-tight">{item.mp_name}</span>
      ),
    },
    {
      header: renderSortHeader('House', 'house'),
      accessor: 'house',
      className: 'whitespace-nowrap',
      render: (item) => (
        <span
          className={`text-[11px] px-2.5 py-0.5 rounded font-medium whitespace-nowrap inline-block ${
            item.house === 'Lok Sabha'
              ? 'bg-blue-50 text-blue-800 border border-blue-200'
              : 'bg-purple-50 text-purple-800 border border-purple-200'
          }`}
        >
          {item.house}
        </span>
      ),
    },
    {
      header: renderSortHeader('Constituency / State', 'state'),
      render: (item) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{item.constituency || '—'}</p>
          <p className="text-[10px] text-slate-500">{item.state}</p>
        </div>
      ),
    },
    {
      header: renderSortHeader('Works', 'total_works'),
      accessor: 'total_works',
      className: 'text-right',
      render: (item) => (
        <span className="font-mono text-xs tabular-nums text-slate-800 font-medium">
          {item.total_works.toLocaleString()}
        </span>
      ),
    },
    {
      header: renderSortHeader('Sanction Outlay', 'total_sanctioned_amount'),
      accessor: 'total_sanctioned_amount',
      className: 'text-right',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
          ₹{(item.total_sanctioned_amount / 1e7).toFixed(2)} Cr
        </span>
      ),
    },
    {
      header: renderSortHeader('Completion Rate', 'completion_rate'),
      accessor: 'completion_rate',
      className: 'text-right',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
          {item.completion_rate.toFixed(1)}%
        </span>
      ),
    },
    {
      header: renderSortHeader('HIGH Cost', 'high_cost_anomalies'),
      accessor: 'high_cost_anomalies',
      className: 'text-center',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold tabular-nums inline-block min-w-[28px] text-center ${
            item.high_cost_anomalies > 0
              ? 'text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded'
              : 'text-slate-400'
          }`}
        >
          {item.high_cost_anomalies}
        </span>
      ),
    },
    {
      header: renderSortHeader('HIGH Fund', 'high_fund_anomalies'),
      accessor: 'high_fund_anomalies',
      className: 'text-center',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold tabular-nums inline-block min-w-[28px] text-center ${
            item.high_fund_anomalies > 0
              ? 'text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded'
              : 'text-slate-400'
          }`}
        >
          {item.high_fund_anomalies}
        </span>
      ),
    },
    {
      header: renderSortHeader('HIGH Delays', 'high_delays'),
      accessor: 'high_delays',
      className: 'text-center',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold tabular-nums inline-block min-w-[28px] text-center ${
            item.high_delays > 0
              ? 'text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded'
              : 'text-slate-400'
          }`}
        >
          {item.high_delays}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header & Title Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/90">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#0c1b2e] text-white">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  MP Portfolio Governance Summary
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md border border-blue-200">
                  Parliamentary Oversight
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Constituency-level portfolio tracking, completion rates, and statutory anomaly distributions.
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: Refresh & CSV Export */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            title="Reload full dataset"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={loading || sortedItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Administrative Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Administrative Unified Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Members of Parliament by name (e.g. 'priya', 'khalsa', 'saroj')..."
              className="block w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* House Filter Dropdown */}
          <div className="flex items-center gap-2 sm:w-64">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={houseFilter}
              onChange={(e) => setHouseFilter(e.target.value)}
              className="block w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="">All Houses ({allMPs.length})</option>
              <option value="Lok Sabha">Lok Sabha ({lokSabhaCount})</option>
              <option value="Rajya Sabha">Rajya Sabha ({rajyaSabhaCount})</option>
            </select>
            {houseFilter && (
              <button
                type="button"
                onClick={() => setHouseFilter('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0 px-1 cursor-pointer"
                title="Reset house filter"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Search Feedback & Dataset Health Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>Coverage:</span>
            </span>
            <span>
              {allMPs.length.toLocaleString()} parliamentary members loaded ({lokSabhaCount} Lok Sabha,{' '}
              {rajyaSabhaCount} Rajya Sabha)
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                <span>Filter: &quot;{searchQuery}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-blue-900 cursor-pointer"
                  title="Remove query"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span>
              Matches: <strong className="text-slate-800">{totalMatching.toLocaleString()}</strong> MPs
            </span>
            <span className="text-slate-300">|</span>
            <span>
              Page <strong className="text-slate-800">{safePage}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong> (20 per page)
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
          <button
            onClick={loadData}
            className="ml-auto underline font-medium text-rose-800 hover:text-rose-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main MP Governance Data Table */}
      <DataTable
        columns={columns}
        data={paginatedItems}
        keyExtractor={(item) => `${item.mp_name}-${item.state}-${item.house}`}
        isLoading={loading}
        pagination={paginationMeta}
        onPageChange={(page) => setCurrentPage(page)}
        emptyMessage={
          searchQuery || houseFilter
            ? `No Members of Parliament matching query "${searchQuery || houseFilter}". Try adjusting your search or house filter.`
            : 'No MP summary records found.'
        }
      />
    </div>
  );
};

