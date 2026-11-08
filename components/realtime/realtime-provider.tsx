"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

type RealtimeRow = Record<string, unknown>;
type RealtimePayload = RealtimePostgresChangesPayload<RealtimeRow>;

function getActorId(payload: RealtimePayload) {
  const row = (payload.new ?? payload.old) as RealtimeRow;
  if (payload.table === "ventas") {
    const key = row.estado === "liberada" ? "liberado_por" : "separado_por";
    return typeof row[key] === "string" ? row[key] : null;
  }
  if (payload.table === "pagos") {
    const key = row.anulado ? "anulado_por" : "registrado_por";
    return typeof row[key] === "string" ? row[key] : null;
  }
  const actorKeys = ["registrado_por"];

  for (const key of actorKeys) {
    if (typeof row[key] === "string") {
      return row[key];
    }
  }
  return null;
}

function getActionLabel(payload: RealtimePayload) {
  const row = (payload.new ?? payload.old) as RealtimeRow;
  if (payload.table === "ventas") {
    return row.estado === "liberada"
      ? "liberó este palco"
      : "separó este palco";
  }
  if (payload.table === "pagos") {
    return row.anulado ? "anuló un abono" : "registró un abono";
  }
  if (payload.table === "devoluciones") {
    return "registró una devolución";
  }
  if (payload.table === "compradores") {
    return "actualizó los datos del comprador";
  }
  return "actualizó un pago";
}

export function RealtimeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const selectedNumber = Number.parseInt(searchParams.get("palco") ?? "", 10);

  useEffect(() => {
    const channel = supabase
      .channel("palcos-live-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ventas",
        },
        (payload) => void handleChange(payload as RealtimePayload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pagos",
        },
        (payload) => void handleChange(payload as RealtimePayload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pago_aplicaciones",
        },
        (payload) => void handleChange(payload as RealtimePayload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "devoluciones",
        },
        (payload) => void handleChange(payload as RealtimePayload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "compradores",
        },
        (payload) => void handleChange(payload as RealtimePayload),
      )
      .subscribe();

    async function handleChange(payload: RealtimePayload) {
      router.refresh();

      if (pathname !== "/" || !Number.isInteger(selectedNumber)) {
        return;
      }

      const { data: selectedBox } = await supabase
        .from("v_palcos")
        .select("numero, venta_id, comprador_id")
        .eq("numero", selectedNumber)
        .maybeSingle();

      if (!selectedBox) {
        return;
      }

      const row = (payload.new ?? payload.old) as RealtimeRow;
      const affectsOpenBox =
        (payload.table === "ventas" &&
          (row.palco_numero === selectedNumber ||
            row.id === selectedBox.venta_id)) ||
        (payload.table === "pagos" &&
          row.comprador_id === selectedBox.comprador_id) ||
        (payload.table === "pago_aplicaciones" &&
          row.venta_id === selectedBox.venta_id) ||
        (payload.table === "devoluciones" &&
          row.venta_id === selectedBox.venta_id) ||
        (payload.table === "compradores" &&
          row.id === selectedBox.comprador_id);

      if (!affectsOpenBox || payload.table === "pago_aplicaciones") {
        return;
      }

      let actorId = getActorId(payload);
      if (
        !actorId &&
        payload.table === "compradores" &&
        typeof row.id === "string"
      ) {
        const { data: log } = await supabase
          .from("bitacora")
          .select("usuario_id")
          .eq("entidad", "comprador")
          .eq("entidad_id", row.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        actorId = log?.usuario_id ?? null;
      }
      let actorName = "Otro usuario";
      if (actorId) {
        const { data: actor } = await supabase
          .from("usuarios")
          .select("nombre")
          .eq("id", actorId)
          .maybeSingle();
        actorName = actor?.nombre ?? actorName;
      }

      toast.info(
        `${actorName} ${getActionLabel(payload)}. Datos actualizados.`,
      );
    }

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pathname, router, selectedNumber, supabase]);

  return children;
}
