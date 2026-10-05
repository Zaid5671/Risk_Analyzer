import React from 'react';
import { Link } from 'react-router-dom';
import type { WorkBrief } from '@/types/common';
import { titleCase } from '@/lib/format';

export const workPath = (workId: string) => `/works/${encodeURIComponent(workId)}`;

/** First column of every model table: what the work is, where, and a link to its full profile. */
export const WorkCell: React.FC<{ workId: string; work?: WorkBrief | null; showMp?: boolean }> = ({
  workId,
  work,
  showMp = true,
}) => {
  const description = work?.work_description;
  const place = work ? [titleCase(work.district), work.state].filter(Boolean).join(', ') : '';
  return (
    <div className="min-w-[220px] max-w-md">
      <Link
        to={workPath(workId)}
        className="font-semibold text-[13px] text-slate-900 hover:text-blue-700 hover:underline line-clamp-2"
        title={description || workId}
      >
        {description ? titleCase(description) : workId}
      </Link>
      {(place || (showMp && work?.mp_name)) && (
        <div className="text-[11px] text-slate-500 mt-0.5">
          {place}
          {showMp && work?.mp_name ? ` · MP ${titleCase(work.mp_name)}` : ''}
        </div>
      )}
      {description && <div className="font-mono text-[10.5px] text-slate-400 mt-0.5">{workId}</div>}
    </div>
  );
};

/** The plain-language "why was this flagged" sentence from the API. */
export const ReasonCell: React.FC<{ reason?: string | null; fallback?: string | null }> = ({ reason, fallback }) => (
  <p className="text-xs text-slate-700 leading-snug max-w-md" title={fallback || undefined}>
    {reason || fallback || '—'}
  </p>
);
