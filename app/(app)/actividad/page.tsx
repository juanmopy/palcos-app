import { Activity } from "lucide-react";

import {
  ActivityList,
  type ActivityEntry,
} from "@/components/activity/activity-list";
import { EmptyState } from "@/components/layout/empty-state";
import { formatCOP } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Detail = Record<string, unknown>;

function detailValue(detail: unknown): Detail {
  return detail && typeof detail === "object" && !Array.isArray(detail)
    ? (detail as Detail)
    : {};
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : null;
}

function textFor(action: string, detail: Detail) {
  const box = typeof detail.palco === "number" ? detail.palco : null;
  const amount =
    numberValue(detail.monto) ?? numberValue(detail.monto_devolucion);
  if (action === "registrar_pago")
    return `registró un abono${box ? ` en el palco ${box}` : ""}${amount !== null ? ` de ${formatCOP(amount)}` : ""}`;
  if (action === "separar") return `separó el palco ${box ?? ""}`.trim();
  if (action === "liberar")
    return `liberó el palco${box ? ` ${box}` : ""}${amount !== null ? ` y registró una devolución de ${formatCOP(amount)}` : ""}`;
  if (action === "anular_pago")
    return `anuló un abono${typeof detail.motivo === "string" ? `: ${detail.motivo}` : ""}`;
  if (action === "crear_comprador") return "creó un comprador";
  if (action === "editar_comprador") return "editó los datos de un comprador";
  return action.replaceAll("_", " ");
}

export default async function ActivityPage() {
  const supabase = await createClient();
  const { data: logs, error } = await supabase
    .from("bitacora")
    .select("id, usuario_id, accion, entidad, entidad_id, detalle, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("No se pudo cargar la actividad.");
  const userIds = [
    ...new Set(
      (logs ?? [])
        .map((log) => log.usuario_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { data: users, error: usersError } = userIds.length
    ? await supabase.from("usuarios").select("id, nombre").in("id", userIds)
    : { data: [], error: null };
  if (usersError)
    throw new Error("No se pudieron cargar los usuarios de la actividad.");
  const names = new Map((users ?? []).map((user) => [user.id, user.nombre]));
  const entries: ActivityEntry[] = (logs ?? []).map((log) => {
    const detail = detailValue(log.detalle);
    return {
      id: log.id,
      actorId: log.usuario_id,
      actorName: names.get(log.usuario_id ?? "") ?? "Sistema",
      action: log.accion,
      text: textFor(log.accion, detail),
      createdAt: log.created_at,
      amount: numberValue(detail.monto) ?? numberValue(detail.monto_devolucion),
    };
  });
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Historial
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Actividad</h1>
        <p className="mt-2 text-slate-600">
          Consulta los cambios realizados por el equipo.
        </p>
      </header>
      {entries.length ? (
        <ActivityList entries={entries} />
      ) : (
        <EmptyState
          icon={Activity}
          title="Aún no hay actividad"
          description="Las separaciones, abonos y cambios aparecerán aquí."
        />
      )}
    </div>
  );
}
