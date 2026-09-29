'use client';

// Screen-only toolbar above a printable document; the browser's print dialog
// is the PDF export ("Save as PDF").
export function PrintBar({ back, note }: { back: string; note: string }) {
  return (
    <div className="no-print sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 bg-ink px-6 py-3 text-paper">
      <a href={back} className="font-mono text-[10px] uppercase tracking-[0.1em] text-paper-dim hover:text-paper">← Back to console</a>
      <span className="font-mono text-[9.5px] uppercase tracking-[0.08em] text-lime">{note}</span>
      <button
        type="button"
        onClick={() => window.print()}
        className="h-9 bg-lime px-4 text-[13px] font-semibold text-ink hover:bg-lime-hover"
      >
        Print / save as PDF
      </button>
    </div>
  );
}
