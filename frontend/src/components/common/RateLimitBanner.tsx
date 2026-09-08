import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { RATE_LIMIT_EVENT, type RateLimitDetail } from '@/lib/api-client';

export const RateLimitBanner: React.FC = () => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const customEvent = e as CustomEvent<RateLimitDetail>;
      setSecondsRemaining(customEvent.detail.retryAfter || 60);
    };

    window.addEventListener(RATE_LIMIT_EVENT, handleRateLimit);
    return () => window.removeEventListener(RATE_LIMIT_EVENT, handleRateLimit);
  }, []);

  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) {
      setSecondsRemaining(null);
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  if (!secondsRemaining) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-slate-950" />
        <span>
          HTTP 429 Too Many Requests: SlowAPI security limiter activated. Please pause automated requests. Resuming in{' '}
          <strong>{secondsRemaining}s</strong>...
        </span>
      </div>
      <button
        onClick={() => setSecondsRemaining(null)}
        className="text-slate-900 hover:text-white text-xs underline font-normal ml-4"
      >
        Dismiss
      </button>
    </div>
  );
};
