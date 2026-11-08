"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SummaryBar = {
  label: string;
  available: number;
  separated: number;
  paid: number;
  total: number;
};

export function SummaryChart({ bars }: { bars: SummaryBar[] }) {
  return (
    <div
      role="img"
      aria-label="Palcos disponibles, separados y pagados por color"
      className="h-80 w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={bars}
          margin={{ top: 8, right: 8, left: -20, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="available"
            name="Disponible"
            stackId="status"
            fill="#cbd5e1"
          />
          <Bar
            dataKey="separated"
            name="Separado"
            stackId="status"
            fill="#fde68a"
          />
          <Bar dataKey="paid" name="Pagado" stackId="status" fill="#10b981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </article>
  );
}
