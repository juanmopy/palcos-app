import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <section className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Icon aria-hidden="true" size={28} />
      </span>
      <h1 className="mt-5 text-xl font-bold text-slate-950">{title}</h1>
      <p className="mt-2 max-w-md text-slate-600">{description}</p>
    </section>
  );
}
