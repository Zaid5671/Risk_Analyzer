import { useEffect, useRef, useState } from 'react';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const canObserve = () => typeof IntersectionObserver !== 'undefined';

/**
 * Returns a ref and a flag that flips to true the first time the element
 * scrolls into view. It never flips back, so animations play only once.
 * With reduced motion (or no IntersectionObserver) it starts out true.
 */
export function useInViewOnce<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(() => prefersReducedMotion() || !canObserve());

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, inView]);

  return [ref, inView] as const;
}
