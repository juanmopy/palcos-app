import { CheckCircle2, Clock3, Circle } from "lucide-react";

import type { BoxStatus } from "@/components/map/types";

const statusContent: Record<
  BoxStatus,
  { label: string; className: string; Icon: typeof Circle }
> = {
  disponible: {
    label: "Disponible",
    className: "bg-slate-100 text-slate-700",
    Icon: Circle,
  },
  separado: {
    label: "Separado",
    className: "bg-amber-100 text-amber-900",
    Icon: Clock3,
  },
  pagado: {
    label: "Pagado",
    className: "bg-emerald-100 text-emerald-900",
    Icon: CheckCircle2,
  },
};

export function StatusBadge({ status }: { status: BoxStatus }) {
  const content = statusContent[status];
  const Icon = content.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${content.className}`}
    >
      <Icon aria-hidden="true" size={16} />
      {content.label}
    </span>
  );
}
