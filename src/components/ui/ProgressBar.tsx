export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded bg-line"
    >
      <div
        className="h-full bg-ink transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}
