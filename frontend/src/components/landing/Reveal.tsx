import React, { useEffect, useState } from 'react';
import { prefersReducedMotion, useInViewOnce } from './useInViewOnce';

type RevealFrom = 'up' | 'right' | 'scale';

const hiddenClass: Record<RevealFrom, string> = {
  up: 'opacity-0 translate-y-6',
  right: 'opacity-0 translate-x-10',
  scale: 'opacity-0 scale-95',
};

interface RevealProps {
  children: React.ReactNode;
  /** Delay in ms before this item animates — use for staggering siblings. */
  delay?: number;
  from?: RevealFrom;
  className?: string;
}

/** Fades and slides its children into place the first time they scroll into view. */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, from = 'up', className = '' }) => {
  const [ref, inView] = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none ${
        inView ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : hiddenClass[from]
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
}

/** Counts from 0 to `value` (Indian digit grouping) the first time it scrolls into view. */
export const CountUp: React.FC<CountUpProps> = ({ value, prefix = '', suffix = '', durationMs = 1600 }) => {
  const [ref, inView] = useInViewOnce<HTMLSpanElement>(0.4);
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0));

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};
