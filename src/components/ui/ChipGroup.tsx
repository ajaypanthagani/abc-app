'use client';

// Multi-select chips as toggle buttons with aria-pressed. Selection is shown
// by fill, never by color alone.
export function ChipGroup({
  options,
  value,
  onChange,
  max,
  describedBy,
}: {
  options: { slug: string; displayName: string }[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  describedBy?: string;
}) {
  const toggle = (slug: string) => {
    if (value.includes(slug)) onChange(value.filter((v) => v !== slug));
    else if (!max || value.length < max) onChange([...value, slug]);
  };
  return (
    <div className="flex flex-wrap gap-2" aria-describedby={describedBy}>
      {options.map((o) => {
        const selected = value.includes(o.slug);
        return (
          <button
            key={o.slug}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(o.slug)}
            className={`min-h-10 rounded border px-3.5 text-[14px] transition-colors ${
              selected
                ? 'border-ink bg-ink text-paper'
                : 'border-field bg-card text-fg hover:border-gray'
            }`}
          >
            {selected ? <span aria-hidden="true" className="mr-1.5">✓</span> : null}
            {o.displayName}
          </button>
        );
      })}
    </div>
  );
}
