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

function textFor(action: string, detail: Detail, boxes: number[]) {
  const explicitBox = typeof detail.palco === "number" ? detail.palco : null;
  const boxText =
    explicitBox !== null
      ? ` en el palco ${explicitBox}`
      : boxes.length
        ? ` en el palco${boxes.length > 1 ? "s" : ""} ${boxes.join(", ")}`
        : "";
  const amount =
    numberValue(detail.monto) ?? numberValue(detail.monto_devolucion);
  if (action === "registrar_pago")
    return `registró un abono${boxText}${amount !== null ? ` de ${formatCOP(amount)}` : ""}`;
  if (action === "separar")
    return `separó el palco ${explicitBox ?? boxes[0] ?? ""}`.trim();
  if (action === "liberar")
    return `liberó el palco${(explicitBox ?? boxes[0]) ? ` ${explicitBox ?? boxes[0]}` : ""}${amount !== null ? ` y registró una devolución de ${formatCOP(amount)}` : ""}`;
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
  const saleIds = [
    ...new Set(
      (logs ?? [])
        .filter((log) => log.entidad === "venta")
        .map((log) => log.entidad_id),
    ),
  ];
  const paymentIds = [
    ...new Set(
      (logs ?? [])
        .filter((log) => log.entidad === "pago")
        .map((log) => log.entidad_id),
    ),
  ];
  const [
    { data: sales, error: salesError },
    { data: applications, error: applicationsError },
  ] = await Promise.all([
    saleIds.length
      ? supabase.from("ventas").select("id, palco_numero").in("id", saleIds)
      : { data: [], error: null },
    paymentIds.length
      ? supabase
          .from("pago_aplicaciones")
          .select("pago_id, venta_id")
          .in("pago_id", paymentIds)
      : { data: [], error: null },
  ]);
  if (salesError || applicationsError) {
    throw new Error("No se pudieron cargar los palcos de la actividad.");
  }
  const boxBySale = new Map(
    (sales ?? []).map((sale) => [sale.id, sale.palco_numero]),
  );
  const boxesByPayment = new Map<string, number[]>();
  for (const application of applications ?? []) {
    const box = boxBySale.get(application.venta_id);
    if (box === undefined) continue;
    boxesByPayment.set(application.pago_id, [
      ...(boxesByPayment.get(application.pago_id) ?? []),
      box,
    ]);
  }
  const names = new Map((users ?? []).map((user) => [user.id, user.nombre]));
  const entries: ActivityEntry[] = (logs ?? []).map((log) => {
    const detail = detailValue(log.detalle);
    return {
      id: log.id,
      actorId: log.usuario_id,
      actorName: names.get(log.usuario_id ?? "") ?? "Sistema",
      action: log.accion,
      text: textFor(
        log.accion,
        detail,
        log.entidad === "pago"
          ? (boxesByPayment.get(log.entidad_id) ?? [])
          : boxBySale.has(log.entidad_id)
            ? [boxBySale.get(log.entidad_id) ?? 0]
            : [],
      ),
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
