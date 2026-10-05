import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from 'lucide-react';
import type { PaginationMeta } from '@/types/common';

export interface Column<T> {
  header: string | React.ReactNode;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  isLoading?: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  pagination,
  onPageChange,
  emptyMessage = 'No records found matching criteria.',
}: DataTableProps<T>) {
  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Phones: each row becomes a card — first column as the title, the rest as labelled lines */}
      <div className="sm:hidden divide-y divide-slate-100">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse space-y-2">
              <div className="h-3.5 bg-slate-200/70 rounded w-3/4" />
              <div className="h-3 bg-slate-200/50 rounded w-1/2" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">{emptyMessage}</p>
          </div>
        ) : (
          data.map((item) => (
            <div key={keyExtractor(item)} className="p-4 space-y-2 text-xs text-slate-700">
              {columns.map((col, cIdx) => {
                const value = col.render ? col.render(item) : col.accessor ? String(item[col.accessor] ?? '—') : '—';
                if (cIdx === 0) return <div key={cIdx}>{value}</div>;
                return (
                  <div key={cIdx} className="flex items-start justify-between gap-3">
                    {col.header ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 pt-0.5">
                        {col.header}
                      </span>
                    ) : null}
                    <div className={`min-w-0 ${col.header ? 'text-right' : ''}`}>{value}</div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div className="hidden sm:block overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              {columns.map((col, idx) => (
                <th key={idx} className={`py-2.5 px-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3.5">
                      <div className="h-3.5 bg-slate-200/70 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-10 text-center text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={keyExtractor(item)} className="hover:bg-slate-50/70 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-2.5 px-3.5 text-slate-700 ${col.className || ''}`}>
                      {col.render ? col.render(item) : col.accessor ? String(item[col.accessor] ?? '—') : '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="py-2.5 px-3.5 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-2 text-xs text-slate-600">
          <div className="tabular-nums">
            Page <strong>{pagination.page}</strong> of <strong>{pagination.total_pages.toLocaleString('en-IN')}</strong>
            <span className="hidden sm:inline">
              {' '}(<strong>{pagination.total_records.toLocaleString('en-IN')}</strong> total records)
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange?.(1)}
              disabled={pagination.page <= 1 || isLoading}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.has_prev || isLoading}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium tabular-nums text-xs">
              {pagination.page} / {pagination.total_pages || 1}
            </span>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.has_next || isLoading}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.total_pages)}
              disabled={pagination.page >= pagination.total_pages || isLoading}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
