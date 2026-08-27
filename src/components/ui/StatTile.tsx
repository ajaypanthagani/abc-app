import { Micro } from './Micro';

export function StatTile({
  label,
  value,
  footnote,
}: {
  label: string;
  value: string;
  footnote?: string;
}) {
  return (
    <div className="rounded border border-edge bg-card p-4">
      <Micro>{label}</Micro>
      <div className="mt-2 text-3xl font-medium tracking-tight text-fg">{value}</div>
      {footnote ? <div className="mt-1 text-[13px] text-fg-muted">{footnote}</div> : null}
    </div>
  );
}
