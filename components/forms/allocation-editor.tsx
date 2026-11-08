"use client";

import { WandSparkles } from "lucide-react";

import { formatCOP, parseCOP } from "@/lib/format";

export type AllocationSale = {
  venta_id: string;
  palco_numero: number;
  saldo: number;
};

type AllocationEditorProps = {
  sales: AllocationSale[];
  allocations: Record<string, number>;
  total: number;
  onChange: (saleId: string, value: number) => void;
  onAutoAllocate: () => void;
};

export function AllocationEditor({
  sales,
  allocations,
  total,
  onChange,
  onAutoAllocate,
}: AllocationEditorProps) {
  const assigned = Object.values(allocations).reduce(
    (sum, value) => sum + value,
    0,
  );
  const remaining = Math.max(0, total - assigned);

  return (
    <section className="space-y-4 border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-950">
            Repartir entre palcos
          </h3>
          <p className="text-sm text-slate-600">
            Ningún palco puede recibir más que su saldo.
          </p>
        </div>
        <button
          type="button"
          onClick={onAutoAllocate}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
        >
          <WandSparkles aria-hidden="true" size={17} />
          Repartir automáticamente
        </button>
      </div>

      <div className="space-y-3">
        {sales.map((sale) => {
          const value = allocations[sale.venta_id] ?? 0;
          const exceeds = value > sale.saldo;
          return (
            <label key={sale.venta_id} className="block">
              <span className="flex justify-between gap-3 text-sm font-medium text-slate-900">
                <span>Palco {sale.palco_numero}</span>
                <span className="font-normal text-slate-600">
                  Saldo: {formatCOP(sale.saldo)}
                </span>
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={value ? formatCOP(value) : ""}
                onChange={(event) =>
                  onChange(sale.venta_id, parseCOP(event.target.value))
                }
                className={`mt-1 min-h-12 w-full rounded-lg border px-4 text-base text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
                  exceeds
                    ? "border-red-500 ring-1 ring-red-200"
                    : "border-slate-300"
                }`}
                aria-describedby={`allocation-${sale.venta_id}`}
              />
              <span
                id={`allocation-${sale.venta_id}`}
                className={`mt-1 block text-xs ${
                  exceeds ? "text-red-700" : "text-slate-600"
                }`}
              >
                {exceeds
                  ? `Máximo ${formatCOP(sale.saldo)}`
                  : `Asignado: ${formatCOP(value)}`}
              </span>
            </label>
          );
        })}
      </div>

      <p
        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
          remaining === 0
            ? "bg-emerald-50 text-emerald-800"
            : "bg-amber-50 text-amber-900"
        }`}
        aria-live="polite"
      >
        Asignado {formatCOP(assigned)} de {formatCOP(total)} · Falta asignar{" "}
        {formatCOP(remaining)}
      </p>
    </section>
  );
}
