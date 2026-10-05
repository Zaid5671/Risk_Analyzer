import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '@/services/analytics';
import type { DuplicatePairItem, DuplicateGroupItem, DuplicateSummary } from '@/types/duplicate_work';
import type { PaginationMeta } from '@/types/common';
import { DataTable, type Column } from '@/components/common/DataTable';
import { SeverityBadge } from '@/components/common/Badge';
import { WorkCell, workPath } from '@/components/common/WorkCell';
import { formatINR, formatINRCompact, formatNumber, titleCase } from '@/lib/format';
import { Copy, Filter, GitCompare, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

type View = 'groups' | 'pairs';

const compareLink = (id1: string, id2: string) =>
  `/duplicates/compare?id1=${encodeURIComponent(id1)}&id2=${encodeURIComponent(id2)}`;

export const DuplicateWorks: React.FC = () => {
  const [view, setView] = useState<View>('groups');
  const [summary, setSummary] = useState<DuplicateSummary | null>(null);
  const [singleMpOnly, setSingleMpOnly] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta | undefined>();
  const [groups, setGroups] = useState<DuplicateGroupItem[]>([]);
  const [pairs, setPairs] = useState<DuplicatePairItem[]>([]);
  const [severity, setSeverity] = useState<string>('');
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    analyticsService.getDuplicateSummary().then(setSummary).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (view === 'groups') {
          const res = await analyticsService.getDuplicateGroups({
            page,
            page_size: 10,
            is_single_mp: singleMpOnly ? true : undefined,
          });
          setGroups(res.items);
          setPagination(res.pagination);
          setExpanded(page === 1 && res.items.length ? res.items[0].group_id : null);
        } else {
          const res = await analyticsService.getDuplicateWorks({
            page,
            page_size: 20,
            severity: severity || undefined,
            is_same_mp: singleMpOnly ? true : undefined,
          });
          setPairs(res.items);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [view, page, singleMpOnly, severity]);

  const switchView = (v: View) => {
    setView(v);
    setPage(1);
  };

  const pairColumns: Column<DuplicatePairItem>[] = [
    { header: 'Work 1', render: (item) => <WorkCell workId={item.work_id_1} work={item.work_1} /> },
    { header: 'Work 2', render: (item) => <WorkCell workId={item.work_id_2} work={item.work_2} /> },
    {
      header: 'Match',
      className: 'whitespace-nowrap',
      render: (item) => (
        <div className="text-xs tabular-nums space-y-0.5">
          <div className="font-bold text-slate-800">{(item.duplicate_score * 100).toFixed(0)}% overall</div>
          <div className="text-[11px] text-slate-500">
            text {item.semantic_similarity != null ? `${(item.semantic_similarity * 100).toFixed(0)}%` : '—'} · amount{' '}
            {item.amount_similarity != null ? `${(item.amount_similarity * 100).toFixed(0)}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500">
            {item.days_diff === 0 ? 'same day' : item.days_diff != null ? `${item.days_diff} days apart` : ''}
            {item.is_same_mp ? ' · same MP' : ''}
          </div>
        </div>
      ),
    },
    { header: 'Tier', accessor: 'severity', render: (item) => <SeverityBadge severity={item.severity} /> },
    {
      header: '',
      render: (item) => (
        <Link
          to={compareLink(item.work_id_1, item.work_id_2)}
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
            <h1 className="text-xl font-bold text-slate-900">Duplicate Work Detection</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Near-identical works — same description, amount and MP, sanctioned close together.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={singleMpOnly}
              onChange={(e) => {
                setSingleMpOnly(e.target.checked);
                setPage(1);
              }}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <span>Same MP only</span>
          </label>
          {view === 'pairs' && (
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
                <option value="">All tiers</option>
                <option value="HIGH">HIGH</option>
                <option value="REVIEW">REVIEW</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          )}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold" role="tablist">
            {(['groups', 'pairs'] as View[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => switchView(v)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  view === v ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {v === 'groups' ? 'Groups' : 'All pairs'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Groups found', summary ? formatNumber(summary.total_groups) : '—'],
          ['Works involved', summary ? formatNumber(summary.total_works_involved) : '—'],
          ['Underlying flagged pairs', summary ? formatNumber(summary.total_pairs) : '—'],
          ['Largest group', summary ? `${formatNumber(summary.largest_group_size)} works` : '—'],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums">{value}</div>
          </div>
        ))}
      </div>

      {view === 'pairs' ? (
        <DataTable
          columns={pairColumns}
          data={pairs}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          pagination={pagination}
          onPageChange={setPage}
          emptyMessage="No duplicate pairs flagged under current criteria."
        />
      ) : (
        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))
            : groups.map((g) => (
                <GroupCard
                  key={g.group_id}
                  group={g}
                  open={expanded === g.group_id}
                  onToggle={() => setExpanded(expanded === g.group_id ? null : g.group_id)}
                />
              ))}
          {!loading && groups.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-400">
              No duplicate groups in your jurisdiction.
            </div>
          )}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>
                Page <strong>{pagination.page}</strong> of <strong>{pagination.total_pages}</strong> ·{' '}
                {formatNumber(pagination.total_records)} groups
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.has_prev || loading}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.has_next || loading}
                  className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const GroupCard: React.FC<{ group: DuplicateGroupItem; open: boolean; onToggle: () => void }> = ({
  group: g,
  open,
  onToggle,
}) => {
  const when =
    g.sanction_span_days === 0
      ? 'same day'
      : g.sanction_span_days != null
        ? `within ${g.sanction_span_days} days`
        : '';
  const anchor = g.works[0]?.work_id;
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-xs">
      <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
            Group #{g.group_id} · {g.work_count} works · {when}
          </div>
          <h3 className="text-base font-semibold text-slate-900 mt-1 line-clamp-2" title={g.work_description || ''}>
            “{g.work_description || g.work_type || 'Similar works'}”
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            {g.mp_names.length === 1 ? `MP ${titleCase(g.mp_names[0])}` : `${g.mp_names.length} different MPs`} ·{' '}
            {g.districts.slice(0, 3).map(titleCase).join(', ')}
            {g.districts.length > 3 ? ` +${g.districts.length - 3}` : ''}, {g.states.join(', ')}
            {g.first_sanction_date ? ` · sanctioned ${g.first_sanction_date}` : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold tabular-nums text-slate-900">{formatINRCompact(g.total_sanctioned_amount)}</div>
          <div className="text-[11px] text-slate-500">total sanctioned</div>
        </div>
      </div>

      {open ? (
        <div className="px-4 sm:px-5 pb-4">
          <div className="rounded-lg border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="text-left font-semibold px-3 py-2">Work ID</th>
                  <th className="text-left font-semibold px-3 py-2">Sanctioned</th>
                  <th className="text-left font-semibold px-3 py-2">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {g.works.map((w) => (
                  <tr key={w.work_id}>
                    <td className="px-3 py-2">
                      <Link to={workPath(w.work_id)} className="font-mono text-blue-700 hover:underline">
                        {w.work_id}
                      </Link>
                    </td>
                    <td className="px-3 py-2 tabular-nums">{formatINR(w.sanction_amount)}</td>
                    <td className="px-3 py-2 text-slate-600">{w.work_status || '—'}</td>
                    <td className="px-3 py-2 text-right">
                      {anchor && w.work_id !== anchor && (
                        <Link
                          to={compareLink(anchor, w.work_id)}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:underline"
                        >
                          <GitCompare className="w-3.5 h-3.5" /> Compare
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {g.work_count > g.works.length && (
              <div className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50">
                + {g.work_count - g.works.length} more works in this group
              </div>
            )}
          </div>
          <button onClick={onToggle} className="mt-2 text-xs font-semibold text-indigo-700 hover:underline">
            Hide works
          </button>
        </div>
      ) : (
        <button
          onClick={onToggle}
          className="px-4 sm:px-5 pb-4 text-xs font-semibold text-indigo-700 hover:underline inline-flex items-center gap-1"
        >
          Show {g.work_count} works <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </section>
  );
};
