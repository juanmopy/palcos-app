import { ChartNoAxesColumn, RotateCcw } from "lucide-react";

import {
  KpiCard,
  SummaryChart,
  type SummaryBar,
} from "@/components/summary/summary-chart";
import { EmptyState } from "@/components/layout/empty-state";
import { formatCOP } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function SummaryPage() {
  const supabase = await createClient();
  const [
    { data: rows, error },
    { data: boxes, error: boxesError },
    { data: refunds, error: refundsError },
    { data: sales, error: salesError },
    { data: buyers, error: buyersError },
    { data: allBoxes, error: allBoxesError },
  ] = await Promise.all([
    supabase.from("v_resumen").select("*").order("categoria_id"),
    supabase
      .from("v_palcos")
      .select(
        "numero, categoria_id, estado, comprador_id, recomendado_por, precio, abonado",
      ),
    supabase.from("devoluciones").select("monto"),
    supabase.from("ventas").select("palco_numero, comprador_id"),
    supabase.from("compradores").select("id, recomendado_por"),
    supabase.from("palcos").select("numero, categoria_id"),
  ]);
  if (
    error ||
    boxesError ||
    refundsError ||
    salesError ||
    buyersError ||
    allBoxesError
  )
    throw new Error("No se pudo cargar el resumen.");
  if (!rows?.length)
    return (
      <EmptyState
        icon={ChartNoAxesColumn}
        title="Resumen sin datos"
        description="Aún no hay palcos configurados."
      />
    );

  const totalEvent = rows.reduce(
    (sum, row) => sum + (row.total ?? 0) * (row.precio ?? 0),
    0,
  );
  const collected = rows.reduce(
    (sum, row) => sum + (row.recaudado_neto ?? 0),
    0,
  );
  const outstanding = rows.reduce((sum, row) => sum + (row.por_cobrar ?? 0), 0);
  const potential = rows.reduce(
    (sum, row) => sum + (row.potencial_disponible ?? 0),
    0,
  );
  const sold = rows.reduce(
    (sum, row) => sum + (row.total ?? 0) - (row.disponibles ?? 0),
    0,
  );
  const totalBoxes = rows.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const progress = totalBoxes ? Math.round((sold / totalBoxes) * 100) : 0;
  const bars: SummaryBar[] = rows.map((row) => ({
    label: row.categoria_nombre ?? row.categoria_id ?? "Sin categoría",
    available: row.disponibles ?? 0,
    separated: row.separados ?? 0,
    paid: row.pagados ?? 0,
    total: row.total ?? 0,
  }));
  const recommendationByBuyer = new Map(
    (buyers ?? []).map((buyer) => [buyer.id, buyer.recomendado_por]),
  );
  const priceByBox = new Map(
    (allBoxes ?? []).map((box) => [box.numero, box.categoria_id]),
  );
  const priceByCategory = new Map(
    rows.map((row) => [row.categoria_id, row.precio ?? 0]),
  );
  const recommendations = new Map<
    string,
    { label: string; boxes: number; value: number; collected: number }
  >();
  for (const box of boxes ?? []) {
    if (!box.comprador_id || !box.recomendado_por) continue;
    const key = box.recomendado_por.trim().replace(/\s+/g, " ").toLowerCase();
    const current = recommendations.get(key) ?? {
      label: box.recomendado_por.trim().replace(/\s+/g, " "),
      boxes: 0,
      value: 0,
      collected: 0,
    };
    current.boxes += 1;
    current.value += box.precio ?? 0;
    current.collected += box.abonado ?? 0;
    recommendations.set(key, current);
  }
  for (const sale of sales ?? []) {
    const recommendation = recommendationByBuyer.get(sale.comprador_id);
    if (!recommendation) continue;
    const key = recommendation.trim().replace(/\s+/g, " ").toLowerCase();
    const current = recommendations.get(key) ?? {
      label: recommendation.trim().replace(/\s+/g, " "),
      boxes: 0,
      value: 0,
      collected: 0,
    };
    if (boxes?.some((box) => box.numero === sale.palco_numero)) continue;
    current.boxes += 1;
    current.value +=
      priceByCategory.get(priceByBox.get(sale.palco_numero) ?? "") ?? 0;
    recommendations.set(key, current);
  }
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Vista general
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Resumen</h1>
        <p className="mt-2 text-slate-600">
          Estado de ventas y recaudo del evento.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Recaudado" value={formatCOP(collected)} />
        <KpiCard
          label="Por cobrar"
          value={formatCOP(outstanding)}
          detail="Saldo de palcos separados"
        />
        <KpiCard label="Potencial disponible" value={formatCOP(potential)} />
        <KpiCard label="Total del evento" value={formatCOP(totalEvent)} />
        <KpiCard
          label="% de avance de ventas"
          value={`${progress}%`}
          detail={`${sold} de ${totalBoxes} palcos separados`}
        />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Palcos por color</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-3">Color</th>
                  <th className="px-2 py-3">Total</th>
                  <th className="px-2 py-3">Disponibles</th>
                  <th className="px-2 py-3">Separados</th>
                  <th className="px-2 py-3">Pagados</th>
                  <th className="px-2 py-3">Recaudado</th>
                  <th className="px-2 py-3">Por cobrar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.categoria_id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-2 py-3 font-semibold">
                      {row.categoria_nombre}
                    </td>
                    <td className="px-2 py-3">{row.total}</td>
                    <td className="px-2 py-3">{row.disponibles}</td>
                    <td className="px-2 py-3">{row.separados}</td>
                    <td className="px-2 py-3">{row.pagados}</td>
                    <td className="px-2 py-3 tabular-nums">
                      {formatCOP(row.recaudado_neto ?? 0)}
                    </td>
                    <td className="px-2 py-3 tabular-nums">
                      {formatCOP(row.por_cobrar ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">Estado por color</h2>
          <div className="mt-5">
            <SummaryChart bars={bars} />
          </div>
        </article>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Ventas por “Recomendado por”
          </h2>
          {recommendations.size ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-2">Persona</th>
                    <th className="py-2">Palcos</th>
                    <th className="py-2">Valor</th>
                    <th className="py-2">Recaudado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...recommendations.values()]
                    .sort((a, b) => b.boxes - a.boxes)
                    .map((item) => (
                      <tr
                        key={item.label}
                        className="border-b border-slate-100"
                      >
                        <td className="py-3 font-semibold">{item.label}</td>
                        <td className="py-3">{item.boxes}</td>
                        <td className="py-3">{formatCOP(item.value)}</td>
                        <td className="py-3">{formatCOP(item.collected)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Aún no hay ventas con recomendación.
            </p>
          )}
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-950">
            <RotateCcw aria-hidden="true" size={19} />
            Devoluciones
          </h2>
          <p className="mt-4 text-3xl font-bold text-slate-950">
            {formatCOP(
              (refunds ?? []).reduce((sum, refund) => sum + refund.monto, 0),
            )}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {refunds?.length ?? 0} palcos liberados
          </p>
        </article>
      </section>
    </div>
  );
}
