import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { worksService } from '@/services/works';
import type { WorkDetail as WorkDetailType } from '@/types/work';
import { SeverityBadge, Badge } from '@/components/common/Badge';
import {
  ArrowLeft,
  Calendar,
  Building,
  DollarSign,
  AlertTriangle,
  Copy,
  BadgePercent,
  Clock,
  ShieldCheck,
  ExternalLink,
  ReceiptText,
  BrainCircuit,
} from 'lucide-react';

export const WorkDetail: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const [work, setWork] = useState<WorkDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workId) return;
    setLoading(true);
    worksService
      .getWorkById(workId)
      .then(setWork)
      .catch((err) => {
        if (err?.response?.status === 403) {
          setError('403 Forbidden: You do not have jurisdictional access to this work under statutory RBAC.');
        } else if (err?.response?.status === 404) {
          setError('404 Not Found: The requested Work ID does not exist in the repository.');
        } else {
          setError('Failed to load work details.');
        }
      })
      .finally(() => setLoading(false));
  }, [workId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Retrieving Work Investigation Dossier...</p>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-xl text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto mb-3 flex items-center justify-center font-bold text-lg">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Dossier Access Error</h2>
        <p className="text-sm text-slate-600 mb-4">{error}</p>
        <Link
          to="/works"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Works Registry</span>
        </Link>
      </div>
    );
  }

  const profiles = work.independent_risk_profiles;
  const voucherDisbursed =
    work.expenditures && work.expenditures.length > 0
      ? work.expenditures.reduce((sum, e) => sum + (e.fund_disbursed_amount || 0), 0)
      : null;
  const effectiveDisbursed =
    work.amount_disbursed != null
      ? (work.amount_disbursed === 0 && voucherDisbursed && voucherDisbursed > 0 ? voucherDisbursed : work.amount_disbursed)
      : voucherDisbursed;

  const utilizationRate =
    work.sanction_amount && effectiveDisbursed != null && work.sanction_amount > 0
      ? (effectiveDisbursed / work.sanction_amount) * 100
      : 0;
  const utilization = Math.min(100, Math.round(utilizationRate));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <Link
          to="/works"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Works Registry</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Dossier Ref: {work.work_id}</span>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-500">WORK ID</span>
              <h1 className="text-xl font-extrabold text-slate-900 font-mono">{work.work_id}</h1>
              <Badge variant={work.is_completed_flag ? 'success' : 'info'}>
                {work.work_status || 'In Progress'}
              </Badge>
            </div>
            <p className="text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed font-medium">
              {work.work_description || 'No detailed work description recorded.'}
            </p>
          </div>

          {/* Financial summary pills */}
          <div className="flex flex-wrap lg:flex-nowrap gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Sanction Outlay</p>
              <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {work.sanction_amount != null ? `₹${work.sanction_amount.toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] uppercase font-bold text-slate-500">Disbursed Amount</p>
              <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {effectiveDisbursed != null ? `₹${effectiveDisbursed.toLocaleString()}` : '₹0'}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] uppercase font-bold text-slate-500">Utilization</p>
              <p className="text-base font-bold text-blue-700 font-mono mt-0.5">{utilization}%</p>
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Category</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{work.work_category || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Work Type</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{work.work_type || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">State / District</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {work.district}, {work.state}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">MP Recommendation</span>
            <span className="font-semibold text-slate-800 mt-0.5 block">{work.mp_name || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Implementing Agency</span>
            <span className="font-semibold text-slate-800 mt-0.5 block line-clamp-1" title={work.ida || ''}>
              {work.ida || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Sanction Date</span>
            <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
              {work.sanction_date || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Independent Analytical Modules (Strict Isolation — Zero Composite Score) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Independent Analytical Profiles (4 Models)
            </h2>
            <p className="text-[11px] text-slate-500">
              Evaluated strictly in isolation with zero composite weighting or hidden scoring.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Independent Audits</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Cost Anomaly Profile */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-rose-100 text-rose-700">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    1. Cost Anomaly Audit
                  </h3>
                </div>
                {profiles.cost_anomaly ? (
                  <SeverityBadge severity={profiles.cost_anomaly.severity} />
                ) : (
                  <Badge variant="neutral">Not Flagged</Badge>
                )}
              </div>

              {profiles.cost_anomaly ? (
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Calibrated Score:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {(profiles.cost_anomaly.cost_anomaly_score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Peer Group Used:</span>
                    <span className="font-medium text-slate-800">
                      {profiles.cost_anomaly.peer_group_used || 'Category Median'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Peer Sample Size:</span>
                    <span className="font-mono text-slate-800">
                      {profiles.cost_anomaly.peer_group_size?.toLocaleString() || '—'} works
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                    {profiles.cost_anomaly.explanation || 'Evaluated against category peer median.'}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  Cost is within the standard statistical IQR bounds of its category peer group.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <Link
                to="/analytics/cost-anomalies"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View Cost Queue →
              </Link>
            </div>
          </div>

          {/* Card 2: Duplicate Candidate Pairs */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-700">
                    <Copy className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    2. Potential Duplicates ({profiles.duplicate_pairs.length})
                  </h3>
                </div>
                {profiles.duplicate_pairs.length > 0 ? (
                  <SeverityBadge severity={profiles.duplicate_pairs[0].severity} />
                ) : (
                  <Badge variant="neutral">No Duplicates</Badge>
                )}
              </div>

              {profiles.duplicate_pairs.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-600">
                    Flagged in <strong>{profiles.duplicate_pairs.length}</strong> candidate pair(s) using semantic
                    embeddings:
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {profiles.duplicate_pairs.map((p) => {
                      const otherId = p.work_id_1 === work.work_id ? p.work_id_2 : p.work_id_1;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-mono font-semibold text-slate-800">{otherId}</span>
                            <span className="ml-2 text-[10px] text-slate-500 font-mono">
                              Similarity: {(p.duplicate_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          <Link
                            to={`/duplicates/compare?id1=${encodeURIComponent(work.work_id)}&id2=${encodeURIComponent(otherId)}`}
                            className="text-xs text-indigo-600 hover:underline font-bold"
                          >
                            Compare →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  No overlapping candidate works flagged by semantic transformer models.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <Link
                to="/analytics/duplicate-works"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View Duplicate Registry →
              </Link>
            </div>
          </div>

          {/* Card 3: Fund & Expenditure Audit */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-100 text-amber-700">
                    <BadgePercent className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    3. Fund & Expenditure Audit
                  </h3>
                </div>
                {profiles.fund_anomaly ? (
                  <SeverityBadge severity={profiles.fund_anomaly.severity} />
                ) : (
                  <Badge variant="neutral">Normal Flow</Badge>
                )}
              </div>

              {profiles.fund_anomaly ? (
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Audit Category:</span>
                    <Badge variant="neutral" size="sm">
                      {profiles.fund_anomaly.audit_category.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Utilization Ratio:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {profiles.fund_anomaly.utilization_ratio != null
                        ? `${(profiles.fund_anomaly.utilization_ratio * 100).toFixed(1)}%`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vendor HHI Concentration:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {profiles.fund_anomaly.payment_concentration_hhi?.toFixed(3) || '—'}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                    {profiles.fund_anomaly.explanation || 'Reconciled with normal expenditure patterns.'}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  Disbursements are consistent with work progress and vendor diversity limits.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <Link
                to="/analytics/fund-anomalies"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View Fund Queue →
              </Link>
            </div>
          </div>

          {/* Card 4: Statutory Delay Audit */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100 text-blue-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    4. Statutory Delay & SLA Audit
                  </h3>
                </div>
                {profiles.delay ? (
                  <SeverityBadge severity={profiles.delay.severity} />
                ) : (
                  <Badge variant="neutral">Within Timeline</Badge>
                )}
              </div>

              {profiles.delay ? (
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sanction SLA (75 Days):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {profiles.delay.rec_to_sanc_days != null ? `${profiles.delay.rec_to_sanc_days}d` : '—'}
                      {profiles.delay.rec_to_sanc_delay_days != null && profiles.delay.rec_to_sanc_delay_days > 0 && (
                        <span className="text-rose-600 ml-1 font-bold">
                          (+{profiles.delay.rec_to_sanc_delay_days}d overdue)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completion SLA (365 Days):</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {profiles.delay.sanc_to_comp_days != null ? `${profiles.delay.sanc_to_comp_days}d` : '—'}
                      {profiles.delay.sanc_to_comp_delay_days != null && profiles.delay.sanc_to_comp_delay_days > 0 && (
                        <span className="text-rose-600 ml-1 font-bold">
                          (+{profiles.delay.sanc_to_comp_delay_days}d)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Open Work Aging Overdue:</span>
                    <span className="font-mono font-semibold text-rose-700">
                      {profiles.delay.open_work_overdue_days != null ? `${profiles.delay.open_work_overdue_days}d` : '0d'}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                    {profiles.delay.explanation || 'Tracked under MPLADS Guidelines 2023 Para 3.12.'}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  Execution is progressing within the statutory 75-day sanction and 365-day completion SLAs.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <Link
                to="/analytics/delays"
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View Delay Tracker →
              </Link>
            </div>
          </div>

          {/* Card 5: AI Predictive Delay Risk (Model 5) */}
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between md:col-span-2 bg-gradient-to-r from-white via-white to-purple-50/30">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-100 text-purple-700">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <span>5. AI Predictive Completion Delay Risk</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded border border-purple-200">
                        Model 5 • Gradient Boosting
                      </span>
                    </h3>
                  </div>
                </div>
                {profiles.delay_prediction ? (
                  <SeverityBadge severity={profiles.delay_prediction.predicted_risk_severity} />
                ) : (
                  <Badge variant="neutral">Not Scored / Completed</Badge>
                )}
              </div>

              {profiles.delay_prediction ? (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Completion Breach Probability:</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-bold ${
                        profiles.delay_prediction.predicted_completion_risk >= 0.75
                          ? 'text-rose-600'
                          : profiles.delay_prediction.predicted_completion_risk >= 0.5
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {(profiles.delay_prediction.predicted_completion_risk * 100).toFixed(1)}%
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            profiles.delay_prediction.predicted_completion_risk >= 0.75
                              ? 'bg-rose-500'
                              : profiles.delay_prediction.predicted_completion_risk >= 0.5
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, profiles.delay_prediction.predicted_completion_risk * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1">Days Since Sanction:</span>
                    <span className="font-mono font-semibold text-slate-800 text-sm">
                      {profiles.delay_prediction.days_since_sanction != null ? `${profiles.delay_prediction.days_since_sanction}d` : '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-1">Current Fund Utilization:</span>
                    <span className="font-mono font-semibold text-slate-800 text-sm">
                      {profiles.delay_prediction.current_utilization != null
                        ? `${(profiles.delay_prediction.current_utilization * 100).toFixed(1)}%`
                        : '0.0%'}
                    </span>
                  </div>

                  <div className="sm:col-span-3">
                    <p className="text-slate-600 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 text-[11px] leading-relaxed">
                      <strong className="text-purple-900 font-semibold">Predictive Assessment: </strong>
                      {profiles.delay_prediction.explanation || 'Evaluated against historical completion velocity and district-level delivery factors.'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  This work is either completed or has low estimated probability of exceeding statutory delivery timelines.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <Link
                to="/analytics/predictions"
                className="text-xs text-purple-600 hover:underline font-semibold"
              >
                View Predictive Queue →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Line-Item Expenditure Vouchers Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <ReceiptText className="w-5 h-5 text-slate-700" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Line-Item Expenditure Records ({work.expenditures.length})
          </h3>
        </div>

        {work.expenditures.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No line-item expenditure vouchers have been disbursed for this work yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-slate-600">
                  <th className="py-2.5 px-3">Voucher Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Vendor / Payee Name</th>
                  <th className="py-2.5 px-3">Disbursed Amount</th>
                  <th className="py-2.5 px-3">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {work.expenditures.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono text-slate-600">#{v.id}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{v.expenditure_date || '—'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{v.vendor_name || 'Vendor Not Stated'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {v.fund_disbursed_amount != null ? `₹${v.fund_disbursed_amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="success" size="sm">
                        {v.payment_status || 'DISBURSED'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
