// Ops console number formatting. Money arrives as integer paise; rates as
// fractions; margins as basis points.

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
const dateYear = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// 86400000 paise → "₹8,64,000"
export function rupees(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return '—';
  return `₹${inr.format(Math.round(minor / 100))}`;
}

// Paise → "₹86.4L" / "₹1.2Cr" / "₹48K" for dense tables and tiles.
export function rupeesShort(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return '—';
  const r = minor / 100;
  if (Math.abs(r) >= 1_00_00_000) return `₹${(r / 1_00_00_000).toFixed(2)}Cr`;
  if (Math.abs(r) >= 1_00_000) return `₹${(r / 1_00_000).toFixed(1)}L`;
  if (Math.abs(r) >= 1_000) return `₹${Math.round(r / 1_000)}K`;
  return `₹${inr.format(Math.round(r))}`;
}

// CPM paise → "₹220"
export const cpm = (minor: number | null | undefined) => (minor ? `₹${inr.format(minor / 100)}` : '—');

// 61234 → "61K", 2_040_000 → "2.04M"
export function views(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 100_000) return `${Math.round(n / 1_000)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export const bps = (b: number | null | undefined) => (b === null || b === undefined ? '—' : `${(b / 100).toFixed(1)}%`);
export const pct = (f: number | null | undefined, digits = 1) =>
  f === null || f === undefined ? '—' : `${(f * 100).toFixed(digits)}%`;

export const shortDate = (iso: string | null | undefined) => (iso ? date.format(new Date(iso)).toUpperCase() : '—');
export const longDate = (iso: string | null | undefined) => (iso ? dateYear.format(new Date(iso)) : '—');

export function windowLabel(from: string | null, to: string | null): string {
  if (!from || !to) return '—';
  return `${shortDate(from)}–${shortDate(to)}`;
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return '—';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function initials(name: string | null | undefined, fallback = '??'): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return (parts[0][0] + (parts[1]?.[0] ?? parts[0][1] ?? '')).toUpperCase();
}

// "CHANGES_REQUESTED" → "Changes requested"
export const humanize = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

// Rupee input → paise; tolerant of commas and spaces.
export function parseRupees(input: string): number | null {
  const n = Number(input.replace(/[₹,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
