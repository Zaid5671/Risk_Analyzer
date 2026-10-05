/** Full rupee amount with Indian digit grouping: ₹20,00,000. */
export const formatINR = (amount?: number | null): string =>
  amount == null ? '—' : '₹' + Math.round(amount).toLocaleString('en-IN');

/** Compact rupee amount in Indian units: ₹45,000 · ₹20 L · ₹5,891.4 Cr. */
export const formatINRCompact = (amount?: number | null): string => {
  if (amount == null) return '—';
  if (Math.abs(amount) >= 1e7) return '₹' + (amount / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' Cr';
  if (Math.abs(amount) >= 1e5) return '₹' + (amount / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' L';
  return formatINR(amount);
};

export const formatNumber = (n?: number | null): string => (n == null ? '—' : n.toLocaleString('en-IN'));

/** Portal data is often ALL CAPS; this makes names and descriptions readable. */
export const titleCase = (s?: string | null): string =>
  (s || '').toLowerCase().replace(/(^|[\s(/-])([a-z])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());

export const plural = (n: number, word: string): string => `${n.toLocaleString('en-IN')} ${word}${n === 1 ? '' : 's'}`;
