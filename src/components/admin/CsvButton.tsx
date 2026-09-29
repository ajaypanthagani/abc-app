'use client';

import { buttonClass } from './ui';

// Client-side CSV export of exactly what the table shows. Marked INTERNAL in
// the filename: these files carry CPMs and margins.
export function CsvButton({
  filename,
  rows,
  label = '⤓ CSV',
}: {
  filename: string;
  rows: Record<string, string | number | null>[];
  label?: string;
}) {
  function download() {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: string | number | null) => {
      const s = v === null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-INTERNAL-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" onClick={download} disabled={!rows.length} className={buttonClass('ghost')}>
      {label}
    </button>
  );
}
