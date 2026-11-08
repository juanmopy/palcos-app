type ProgressBarProps = {
  value: number;
  label: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const boundedValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      <div
        className="h-4 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={boundedValue}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-blue-700 transition-[width]"
          style={{ width: `${boundedValue}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{label}</p>
    </div>
  );
}
