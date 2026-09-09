import React, { useState, useEffect, useMemo } from 'react';
import { analyticsService } from '@/services/analytics';
import { worksService } from '@/services/works';
import { useAuth } from '@/context/AuthContext';
import type { DistrictSummaryItem } from '@/types/summaries';
import { DataTable, type Column } from '@/components/common/DataTable';
import {
  MapPin,
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
} from 'lucide-react';

type SortField =
  | 'district'
  | 'state'
  | 'total_works'
  | 'total_sanctioned_amount'
  | 'total_disbursed_amount'
  | 'high_cost_anomalies'
  | 'high_duplicate_pairs'
  | 'high_fund_anomalies'
  | 'high_delays';

type SortDirection = 'asc' | 'desc';

const PAGE_SIZE = 20;

export const DistrictSummary: React.FC = () => {
  const { user } = useAuth();

  // Raw complete dataset
  const [allDistricts, setAllDistricts] = useState<DistrictSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States available for filter dropdown
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Sorting state (default: total_sanctioned_amount descending)
  const [sortField, setSortField] = useState<SortField>('total_sanctioned_amount');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Load complete data guaranteeing 100% coverage
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch available state options for the filter dropdown
      const filterRes = await worksService.getFilters();
      const allStates = filterRes.states || [];
      setAvailableStates(allStates);

      // 2. If user is role-scoped (STATE_OFFICER, DISTRICT_OFFICER, MP), a single call with limit=500 returns all scoped data
      if (user?.role === 'STATE_OFFICER' || user?.role === 'DISTRICT_OFFICER' || user?.role === 'MP') {
        const scopedData = await analyticsService.getDistrictSummaries({ limit: 500 });
        setAllDistricts(scopedData);
      } else {
        // 3. Central Ministry / National Oversight:
        // Query backend across all 36 States in parallel chunks of 6 to guarantee 100% data completeness (861 districts)
        const chunkSize = 6;
        const aggregated: DistrictSummaryItem[] = [];

        for (let i = 0; i < allStates.length; i += chunkSize) {
          const chunk = allStates.slice(i, i + chunkSize);
          const chunkResults = await Promise.all(
            chunk.map((s) => analyticsService.getDistrictSummaries({ state: s, limit: 500 }))
          );
          chunkResults.forEach((res) => {
            aggregated.push(...res);
          });
        }

        // Deduplicate using unique (state, district) key
        const uniqueMap = new Map<string, DistrictSummaryItem>();
        aggregated.forEach((item) => {
          const key = `${item.state.trim().toLowerCase()}::${item.district.trim().toLowerCase()}`;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          }
        });

        const completeList = Array.from(uniqueMap.values());
        setAllDistricts(completeList);
      }
    } catch (err: any) {
      console.error('Failed to load district summary records:', err);
      setError('Failed to load complete district governance data. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Reset pagination to page 1 whenever search query or state dropdown changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stateFilter]);

  // Handle column header click for interactive sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to ascending for text columns, descending for numerical metrics
      setSortDir(field === 'district' || field === 'state' ? 'asc' : 'desc');
    }
  };

  // Pipeline Step 1 & 2: Filter by State dropdown + Search Query across District & State
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allDistricts.filter((item) => {
      // State dropdown filter
      if (stateFilter && item.state.toLowerCase() !== stateFilter.toLowerCase()) {
        return false;
      }

      // Search across DISTRICT + STATE (case-insensitive, partial-match)
      if (q) {
        const districtMatch = item.district.toLowerCase().includes(q);
        const stateMatch = item.state.toLowerCase().includes(q);
        if (!districtMatch && !stateMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allDistricts, stateFilter, searchQuery]);

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

  // Helper to render interactive sortable column header
  const renderSortHeader = (label: string, field: SortField) => {
    const isActive = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-700 hover:text-blue-900 transition-colors group cursor-pointer select-none text-left"
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
      'District',
      'State',
      'Total Works',
      'Sanction Outlay (INR)',
      'Disbursed Amount (INR)',
      'High Cost Anomalies',
      'High Duplicate Pairs',
      'High Fund Anomalies',
      'High Delays',
    ];
    const rows = sortedItems.map((d) => [
      `"${d.district.replace(/"/g, '""')}"`,
      `"${d.state.replace(/"/g, '""')}"`,
      d.total_works,
      d.total_sanctioned_amount,
      d.total_disbursed_amount,
      d.high_cost_anomalies,
      d.high_duplicate_pairs,
      d.high_fund_anomalies,
      d.high_delays,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `district_governance_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 9 Columns preserved exactly as defined in the system
  const columns: Column<DistrictSummaryItem>[] = [
    {
      header: renderSortHeader('District', 'district'),
      accessor: 'district',
      render: (item) => (
        <span className="font-bold text-slate-900 tracking-tight">{item.district}</span>
      ),
    },
    {
      header: renderSortHeader('State', 'state'),
      accessor: 'state',
      render: (item) => <span className="text-slate-700 font-medium">{item.state}</span>,
    },
    {
      header: renderSortHeader('Total Works', 'total_works'),
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
      header: renderSortHeader('Disbursed', 'total_disbursed_amount'),
      accessor: 'total_disbursed_amount',
      className: 'text-right',
      render: (item) => (
        <span className="font-mono text-xs text-slate-700 tabular-nums">
          ₹{(item.total_disbursed_amount / 1e7).toFixed(2)} Cr
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
      header: renderSortHeader('HIGH Duplicate', 'high_duplicate_pairs'),
      accessor: 'high_duplicate_pairs',
      className: 'text-center',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold tabular-nums inline-block min-w-[28px] text-center ${
            item.high_duplicate_pairs > 0
              ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded'
              : 'text-slate-400'
          }`}
        >
          {item.high_duplicate_pairs}
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
              <MapPin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  District Governance Performance Summary
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-900 rounded-md border border-blue-200">
                  National Administrative Roster
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-attribute monitoring across outlay, disbursement, and 4 independent analytical models.
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
              placeholder="Search by district or state name (e.g. 'patna', 'bihar', 'uttar pradesh')..."
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

          {/* State Quick-Filter Dropdown */}
          <div className="flex items-center gap-2 sm:w-64">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="block w-full py-2 px-2.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="">All States / UTs ({availableStates.length})</option>
              {availableStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            {stateFilter && (
              <button
                type="button"
                onClick={() => setStateFilter('')}
                className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0 px-1 cursor-pointer"
                title="Reset state filter"
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
              {allDistricts.length.toLocaleString()} administrative districts loaded across{' '}
              {availableStates.length || 36} States/UTs
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
              Matches: <strong className="text-slate-800">{totalMatching.toLocaleString()}</strong> districts
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

      {/* Main Governance Data Table */}
      <DataTable
        columns={columns}
        data={paginatedItems}
        keyExtractor={(item) => `${item.state}-${item.district}`}
        isLoading={loading}
        pagination={paginationMeta}
        onPageChange={(page) => setCurrentPage(page)}
        emptyMessage={
          searchQuery || stateFilter
            ? `No districts matching query "${searchQuery || stateFilter}". Try adjusting your search term.`
            : 'No district summary records found.'
        }
      />
    </div>
  );
};

