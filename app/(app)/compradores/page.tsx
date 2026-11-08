import { Users } from "lucide-react";

import {
  BuyersList,
  type BuyerListItem,
} from "@/components/buyers/buyers-list";
import { EmptyState } from "@/components/layout/empty-state";
import { createClient } from "@/lib/supabase/server";

export default async function BuyersPage() {
  const supabase = await createClient();
  const [{ data: buyers, error }, { data: boxes, error: boxesError }] =
    await Promise.all([
      supabase.from("v_compradores").select("*"),
      supabase
        .from("v_palcos")
        .select("comprador_id, numero")
        .not("comprador_id", "is", null)
        .not("venta_id", "is", null),
    ]);
  if (error || boxesError) {
    throw new Error("No se pudo cargar la lista de compradores.");
  }
  const boxesByBuyer = new Map<string, number[]>();
  for (const box of boxes ?? []) {
    if (!box.comprador_id || box.numero === null) continue;
    boxesByBuyer.set(box.comprador_id, [
      ...(boxesByBuyer.get(box.comprador_id) ?? []),
      box.numero,
    ]);
  }
  const items: BuyerListItem[] = (buyers ?? []).map((buyer) => ({
    id: buyer.id ?? "",
    nombre_completo: buyer.nombre_completo ?? "Sin nombre",
    documento: buyer.documento ?? "",
    telefono: buyer.telefono ?? "",
    palcos_activos: buyer.palcos_activos ?? 0,
    total_precio: buyer.total_precio ?? 0,
    total_abonado: buyer.total_abonado ?? 0,
    saldo: buyer.saldo ?? 0,
    palco_numeros: (boxesByBuyer.get(buyer.id ?? "") ?? []).sort(
      (left, right) => left - right,
    ),
  }));
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Gestión
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Compradores</h1>
        <p className="mt-2 text-slate-600">
          Consulta compradores, palcos y saldos pendientes.
        </p>
      </header>
      {items.length ? (
        <BuyersList buyers={items} />
      ) : (
        <EmptyState
          icon={Users}
          title="Aún no hay compradores"
          description="Los compradores aparecerán aquí al separar un palco."
        />
      )}
    </div>
  );
}
