"use client";

import { Filter, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/layout/empty-state";
import { formatCOP } from "@/lib/format";

export type ActivityEntry = {
  id: number;
  actorId: string | null;
  actorName: string;
  action: string;
  text: string;
  createdAt: string;
  amount: number | null;
};

function relativeTime(value: string) {
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (seconds < 60) return `hace ${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days === 1 ? "" : "s"}`;
}

export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  const [person, setPerson] = useState("all");
  const [action, setAction] = useState("all");
  const people = [
    ...new Map(
      entries.map((entry) => [entry.actorId, entry.actorName]),
    ).entries(),
  ];
  const actions = [...new Set(entries.map((entry) => entry.action))];
  const filtered = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (person === "all" || entry.actorId === person) &&
          (action === "all" || entry.action === action),
      ),
    [entries, person, action],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <Filter aria-hidden="true" className="text-slate-500" size={18} />
        <label className="flex flex-1 items-center gap-2 text-sm font-medium">
          Persona
          <select
            value={person}
            onChange={(event) => setPerson(event.target.value)}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base"
          >
            <option value="all">Todas</option>
            {people.map(([id, name]) => (
              <option key={id ?? "unknown"} value={id ?? ""}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 items-center gap-2 text-sm font-medium">
          Acción
          <select
            value={action}
            onChange={(event) => setAction(event.target.value)}
            className="min-h-11 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-base"
          >
            <option value="all">Todas</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-800">
                  {entry.actorName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6 text-slate-800">
                    {entry.text}
                  </p>
                  <p
                    className="mt-1 text-xs text-slate-500"
                    title={entry.createdAt}
                  >
                    {relativeTime(entry.createdAt)}
                  </p>
                </div>
                {entry.amount !== null ? (
                  <span className="text-sm font-bold tabular-nums text-slate-950">
                    {formatCOP(entry.amount)}
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ListChecks}
          title="No hay actividad para estos filtros"
          description="Prueba con otra persona o acción."
        />
      )}
    </div>
  );
}
