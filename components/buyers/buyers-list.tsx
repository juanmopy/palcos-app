"use client";

import Link from "next/link";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/layout/empty-state";
import { formatCOP } from "@/lib/format";

export type BuyerListItem = {
  id: string;
  nombre_completo: string;
  documento: string | null;
  telefono: string;
  palcos_activos: number;
  total_precio: number;
  total_abonado: number;
  saldo: number;
  palco_numeros: number[];
};

export function BuyersList({ buyers }: { buyers: BuyerListItem[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "balance">("name");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return buyers
      .filter((buyer) =>
        normalized
          ? [buyer.nombre_completo, buyer.documento, buyer.telefono]
              .join(" ")
              .toLowerCase()
              .includes(normalized)
          : true,
      )
      .sort((left, right) =>
        sort === "name"
          ? left.nombre_completo.localeCompare(right.nombre_completo, "es")
          : right.saldo - left.saldo,
      );
  }, [buyers, query, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Buscar compradores</span>
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, documento o teléfono"
            className="min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>Ordenar por</span>
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as "name" | "balance")
            }
            className="min-h-12 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <option value="name">Nombre</option>
            <option value="balance">Saldo pendiente</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            query ? "No encontramos compradores" : "Aún no hay compradores"
          }
          description={
            query
              ? "Prueba con otro nombre, documento o teléfono."
              : "Los compradores aparecerán aquí al separar un palco."
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((buyer) => {
            const progress =
              buyer.total_precio > 0
                ? Math.min(
                    100,
                    (buyer.total_abonado / buyer.total_precio) * 100,
                  )
                : 0;
            return (
              <Link
                key={buyer.id}
                href={`/compradores/${buyer.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      {buyer.nombre_completo}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {buyer.documento ? `${buyer.documento} · ` : ""}
                      {buyer.telefono}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {buyer.palco_numeros.length ? (
                        buyer.palco_numeros.map((number) => (
                          <span
                            key={number}
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800"
                          >
                            Palco {number}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">
                          Sin palcos activos
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-44 text-left sm:text-right">
                    <p className="text-sm text-slate-600">
                      Total {formatCOP(buyer.total_precio)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Abonado {formatCOP(buyer.total_abonado)}
                    </p>
                    <p className="mt-1 font-bold text-slate-950">
                      Saldo {formatCOP(buyer.saldo)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-500">
                    {Math.round(progress)}% abonado
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
