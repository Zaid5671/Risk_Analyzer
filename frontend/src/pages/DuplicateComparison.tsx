import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { worksService } from '@/services/works';
import { analyticsService } from '@/services/analytics';
import type { WorkDetail } from '@/types/work';
import type { DuplicatePairItem } from '@/types/duplicate_work';
import { SeverityBadge, Badge } from '@/components/common/Badge';
import { ArrowLeft, GitCompare, AlertOctagon, ExternalLink } from 'lucide-react';
import { formatINR, titleCase } from '@/lib/format';

const matchSignals = (a: WorkDetail, b: WorkDetail, pair: DuplicatePairItem | null) => {
  const sameText = (a.work_description || '').trim().toLowerCase() === (b.work_description || '').trim().toLowerCase();
  const amtA = a.sanction_amount ?? 0;
  const amtB = b.sanction_amount ?? 0;
  const sameAmount = amtA > 0 && amtA === amtB;
  const days =
    pair?.days_diff ??
    (a.sanction_date && b.sanction_date
      ? Math.abs((new Date(a.sanction_date).getTime() - new Date(b.sanction_date).getTime()) / 86400000)
      : null);
  return [
    {
      label: sameText ? 'Identical description' : 'Similar description',
      match: sameText || (pair?.semantic_similarity ?? 0) >= 0.9,
      detail: pair?.semantic_similarity != null ? `${(pair.semantic_similarity * 100).toFixed(0)}% text similarity` : 'Text compared',
    },
    {
      label: sameAmount ? 'Same amount' : 'Different amount',
      match: sameAmount,
      detail: sameAmount ? `Both ${formatINR(amtA)}` : `${formatINR(amtA)} vs ${formatINR(amtB)}`,
    },
    {
      label: days === 0 ? 'Sanctioned the same day' : 'Sanction dates',
      match: days != null && days <= 30,
      detail: days == null ? 'Dates unavailable' : days === 0 ? 'Same sanction date' : `${Math.round(days)} days apart`,
    },
    {
      label: a.mp_name === b.mp_name ? 'Same MP' : 'Different MPs',
      match: a.mp_name === b.mp_name,
      detail: a.mp_name === b.mp_name ? titleCase(a.mp_name) : `${titleCase(a.mp_name)} / ${titleCase(b.mp_name)}`,
    },
  ];
};

export const DuplicateComparison: React.FC = () => {
  const [params] = useSearchParams();
  const id1 = params.get('id1');
  const id2 = params.get('id2');

  const [work1, setWork1] = useState<WorkDetail | null>(null);
  const [work2, setWork2] = useState<WorkDetail | null>(null);
  const [pair, setPair] = useState<DuplicatePairItem | null>(null);
  const [work2Forbidden, setWork2Forbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id1 || !id2) return;
    setLoading(true);

    Promise.allSettled([
      worksService.getWorkById(id1),
      worksService.getWorkById(id2),
      // Every flagged pair involving work 1 (not just the first page of the global list)
      analyticsService.getDuplicatePairsForWork(id1),
    ]).then(([res1, res2, resPairs]) => {
      if (res1.status === 'fulfilled') setWork1(res1.value);
      if (res2.status === 'fulfilled') {
        setWork2(res2.value);
      } else if (res2.reason?.response?.status === 403) {
        setWork2Forbidden(true);
      }

      if (resPairs.status === 'fulfilled') {
        const found = resPairs.value.pairs.find(
          (p) =>
            (p.work_id_1 === id1 && p.work_id_2 === id2) ||
            (p.work_id_1 === id2 && p.work_id_2 === id1)
        );
        if (found) setPair(found);
      }
      setLoading(false);
    });
  }, [id1, id2]);

  if (!id1 || !id2) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Invalid comparison parameters. Both ?id1 and ?id2 are required.</p>
        <Link to="/analytics/duplicate-works" className="mt-2 text-blue-600 hover:underline inline-block">
          Return to Duplicates List
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Comparing Candidate Works...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/analytics/duplicate-works"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Duplicate Works</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Pair Comparison: {id1} ⟷ {id2}
        </span>
      </div>

      {/* Comparison Metrics Header Banner */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">Side-by-Side Duplicate Audit</h1>
                {pair && <SeverityBadge severity={pair.severity} />}
              </div>
              <p className="text-xs text-slate-500">
                Evaluating candidate work pair for potential duplicate billing or overlapping scopes.
              </p>
            </div>
          </div>

          {pair && (
            <div className="flex items-center gap-3 bg-indigo-50/80 p-3 rounded-lg border border-indigo-100 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Overall Score</span>
                <span className="font-mono font-bold text-indigo-900 text-base">
                  {(pair.duplicate_score * 100).toFixed(1)}%
                </span>
              </div>
              <div className="border-l border-indigo-200 pl-3">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Semantic Similarity</span>
                <span className="font-mono font-semibold text-slate-800">
                  {pair.semantic_similarity != null ? `${(pair.semantic_similarity * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
              <div className="border-l border-indigo-200 pl-3">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Days Difference</span>
                <span className="font-mono font-semibold text-slate-800">
                  {pair.days_diff != null ? `${pair.days_diff} days` : '—'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Why these match */}
      {work1 && work2 && (
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">Why these were flagged together</h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {matchSignals(work1, work2, pair).map((sig) => (
              <li
                key={sig.label}
                className={`p-3 rounded-lg border ${sig.match ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'}`}
              >
                <div className={`font-bold ${sig.match ? 'text-rose-800' : 'text-slate-600'}`}>
                  {sig.match ? '● ' : '○ '}
                  {sig.label}
                </div>
                <div className="text-slate-600 mt-0.5">{sig.detail}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Side by Side Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Work 1 Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Work #1</span>
              <Link
                to={`/works/${encodeURIComponent(id1)}`}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Full Dossier</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <h2 className="text-base font-extrabold font-mono text-slate-900">{id1}</h2>

            {work1 ? (
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Description</span>
                  <p className="mt-1 font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {work1.work_description || 'No description available'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="text-slate-400 block">Sanction Outlay</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatINR(work1.sanction_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status</span>
                    <Badge variant="info">{work1.work_status || 'In Progress'}</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 block">District / State</span>
                    <span className="font-semibold text-slate-800">
                      {titleCase(work1.district)}, {work1.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">MP</span>
                    <span className="font-semibold text-slate-800">{titleCase(work1.mp_name) || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sanctioned on</span>
                    <span className="font-semibold text-slate-800">{work1.sanction_date || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Implementing agency</span>
                    <span className="font-semibold text-slate-800 line-clamp-2">{work1.ida || '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Details unavailable.</p>
            )}
          </div>
        </div>

        {/* Work 2 Card (Handles Cross-Jurisdiction Gracefully) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Work #2</span>
              {!work2Forbidden && (
                <Link
                  to={`/works/${encodeURIComponent(id2)}`}
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Full Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            <h2 className="text-base font-extrabold font-mono text-slate-900">{id2}</h2>

            {work2Forbidden ? (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  <span>Administrative Jurisdiction Notice</span>
                </div>
                <p className="leading-relaxed">
                  Work <strong>{id2}</strong> is located outside your assigned administrative jurisdiction. Under statutory
                  RBAC policies, deep expenditure vouchers and line-item audits for external works are restricted to Central
                  Ministry and authorized local officers.
                </p>
                <div className="mt-3 p-2 bg-white/70 rounded border border-amber-200 text-[11px]">
                  <strong>Audit Status:</strong> Comparison metrics calculated by server-side Model 2 pipeline remain verified
                  and visible above.
                </div>
              </div>
            ) : work2 ? (
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Description</span>
                  <p className="mt-1 font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {work2.work_description || 'No description available'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <span className="text-slate-400 block">Sanction Outlay</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatINR(work2.sanction_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Status</span>
                    <Badge variant="info">{work2.work_status || 'In Progress'}</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400 block">District / State</span>
                    <span className="font-semibold text-slate-800">
                      {titleCase(work2.district)}, {work2.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">MP</span>
                    <span className="font-semibold text-slate-800">{titleCase(work2.mp_name) || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sanctioned on</span>
                    <span className="font-semibold text-slate-800">{work2.sanction_date || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Implementing agency</span>
                    <span className="font-semibold text-slate-800 line-clamp-2">{work2.ida || '—'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Details unavailable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
