const inNumber = new Intl.NumberFormat('en-IN');

// en-IN grouping (₹1,20,000-style lakh grouping for large counts).
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return inNumber.format(n);
}

// 74,865 -> "74.9K" for stat tiles.
export function compactNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const mins = Math.round((Date.now() - then) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

// Paise → "₹25,960" (lakh grouping, no decimals).
export function rupees(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return '—';
  return `₹${inNumber.format(Math.round(minor / 100))}`;
}

// Paise → "₹96K" / "₹4.9L" for compact chart labels.
export function rupeesCompact(minor: number): string {
  const r = minor / 100;
  if (r >= 100_000) return `₹${(r / 100_000).toFixed(1)}L`;
  if (r >= 1_000) return `₹${Math.round(r / 1_000)}K`;
  return `₹${Math.round(r)}`;
}

const shortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' });
// "14 Aug"
export function shortDate(iso: string | null | undefined): string {
  return iso ? shortFmt.format(new Date(iso)) : '—';
}

// "2026-08" → "Aug"
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(Date.UTC(y, m - 1, 15)));
}

export function windowRange(from: string | null, to: string | null): string {
  if (!from || !to) return '—';
  return `${shortDate(from)} – ${shortDate(to)}`;
}

export function percent(fraction: number | null | undefined, digits = 1): string {
  return fraction === null || fraction === undefined ? '—' : `${(fraction * 100).toFixed(digits)}%`;
}
