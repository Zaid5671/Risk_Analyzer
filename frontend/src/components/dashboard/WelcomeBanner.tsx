import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { titleCase } from '@/lib/format';

const STORAGE_KEY = 'drishti-welcome-dismissed';

const readDismissed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

/** First-visit guidance for demo visitors; dismissible and remembered per browser. */
export const WelcomeBanner: React.FC = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed || !user) return null;

  const viewer =
    user.role === 'MINISTRY'
      ? 'the Central Ministry (all of India)'
      : user.role === 'STATE_OFFICER'
        ? `the State Nodal Officer for ${user.assigned_state}`
        : user.role === 'DISTRICT_OFFICER'
          ? `the District Officer for ${titleCase(user.assigned_district)}, ${user.assigned_state}`
          : `MP ${titleCase(user.assigned_mp_name)}`;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* storage unavailable — banner just reappears next visit */
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 sm:px-5 py-3.5 flex items-start gap-3">
      <span className="text-lg leading-none mt-0.5" aria-hidden="true">👋</span>
      <div className="flex-1 text-sm text-emerald-950">
        <p className="font-semibold">You’re exploring the demo as {viewer}.</p>
        <p className="mt-0.5 text-emerald-900/80 text-[13px]">
          Start with{' '}
          <Link to="/analytics/cost-anomalies" className="underline font-medium">Cost Anomalies</Link> or{' '}
          <Link to="/analytics/duplicate-works" className="underline font-medium">Duplicate Works</Link>, or open any
          work to see all five model results. Use the <b>role switcher</b> at the top to see what other roles see.
        </p>
      </div>
      <button onClick={dismiss} className="p-1 rounded text-emerald-800/70 hover:bg-emerald-100" aria-label="Dismiss welcome message">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
