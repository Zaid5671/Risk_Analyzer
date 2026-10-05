import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Copy, BadgePercent, Clock, BrainCircuit, ArrowRight } from 'lucide-react';
import { analyticsService } from '@/services/analytics';
import type { DuplicateSummary } from '@/types/duplicate_work';
import { formatNumber } from '@/lib/format';

interface Counts {
  cost: number | null;
  fund: number | null;
  delay: number | null;
  prediction: number | null;
  duplicates: DuplicateSummary | null;
}

const total = (p: PromiseSettledResult<{ pagination: { total_records: number } }>) =>
  p.status === 'fulfilled' ? p.value.pagination.total_records : null;

/**
 * The five model cards shown on every dashboard. Counts come from the API, which
 * already restricts them to the signed-in user's jurisdiction.
 */
export const ModelSummaryCards: React.FC = () => {
  const [counts, setCounts] = useState<Counts>({ cost: null, fund: null, delay: null, prediction: null, duplicates: null });

  useEffect(() => {
    Promise.allSettled([
      analyticsService.getCostAnomalies({ severity: 'HIGH', page_size: 1 }),
      analyticsService.getFundAnomalies({ severity: 'HIGH', page_size: 1 }),
      analyticsService.getDelays({ severity: 'HIGH', page_size: 1 }),
      analyticsService.getDelayPredictions({ severity: 'HIGH', page_size: 1 }),
      analyticsService.getDuplicateSummary(),
    ]).then(([cost, fund, delay, prediction, dup]) =>
      setCounts({
        cost: total(cost),
        fund: total(fund),
        delay: total(delay),
        prediction: total(prediction),
        duplicates: dup.status === 'fulfilled' ? dup.value : null,
      })
    );
  }, []);

  const cards = [
    {
      title: 'Cost anomalies',
      value: counts.cost,
      label: 'high-cost outliers',
      how: 'Compares each work’s cost with similar works in the same state',
      cta: 'Inspect outliers',
      to: '/analytics/cost-anomalies',
      icon: AlertTriangle,
      tone: 'text-rose-700',
      ring: 'hover:border-rose-300',
    },
    {
      title: 'Duplicate works',
      value: counts.duplicates?.total_groups ?? null,
      label: counts.duplicates ? `groups · ${formatNumber(counts.duplicates.total_works_involved)} works` : 'groups',
      how: 'Finds near-identical works sanctioned together',
      cta: 'Review groups',
      to: '/analytics/duplicate-works',
      icon: Copy,
      tone: 'text-indigo-700',
      ring: 'hover:border-indigo-300',
    },
    {
      title: 'Fund & payments',
      value: counts.fund,
      label: 'high payment flags',
      how: 'Spots unusual payment timing and size, and money that never moved',
      cta: 'Audit payments',
      to: '/analytics/fund-anomalies',
      icon: BadgePercent,
      tone: 'text-amber-700',
      ring: 'hover:border-amber-300',
    },
    {
      title: 'Statutory delays',
      value: counts.delay,
      label: 'serious deadline breaches',
      how: 'Checks the 75-day sanction and 365-day completion limits',
      cta: 'Triage delays',
      to: '/analytics/delays',
      icon: Clock,
      tone: 'text-blue-700',
      ring: 'hover:border-blue-300',
    },
    {
      title: 'Predicted delays',
      value: counts.prediction,
      label: 'open works at high risk',
      how: 'Forecasts which open works will miss the 365-day limit',
      cta: 'See forecast',
      to: '/analytics/predictions',
      icon: BrainCircuit,
      tone: 'text-purple-700',
      ring: 'hover:border-purple-300',
    },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-2 mb-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">What the 5 models found</h2>
        <span className="text-[11px] text-slate-500">Each model checks a different kind of risk on its own</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              to={c.to}
              className={`group bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col hover:shadow-sm transition-all ${c.ring}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${c.tone}`}>{c.title}</span>
                <Icon className={`w-4 h-4 ${c.tone}`} />
              </div>
              <p className={`mt-3 text-3xl font-black tabular-nums tracking-tight ${c.tone}`}>
                {c.value == null ? <span className="inline-block w-16 h-7 bg-slate-100 rounded animate-pulse" /> : formatNumber(c.value)}
              </p>
              <p className="text-xs font-semibold text-slate-700 mt-1">{c.label}</p>
              <p className="text-[11px] text-slate-500 mt-2.5 flex-1 leading-snug">{c.how}</p>
              <span className={`mt-3 pt-3 border-t border-slate-100 text-xs font-bold inline-flex items-center gap-1 group-hover:gap-1.5 transition-all ${c.tone}`}>
                {c.cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
