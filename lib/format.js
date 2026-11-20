// Small helpers for showing money and names.
// Want a different currency symbol? Change CURRENCY below (for example '' for plain points).
export const CURRENCY = '₹';

export function money(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return CURRENCY + Number(n).toLocaleString('en-IN');
}

export function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || '?'
  );
}
