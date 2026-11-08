"use server";

import { createClient } from "@/lib/supabase/server";
import {
  cancelPaymentSchema,
  registerPaymentSchema,
  releaseBoxSchema,
  separateBoxSchema,
} from "@/lib/validations/box-actions";

type ActionResult = {
  ok: boolean;
  error: string | null;
  id?: string;
};

function validationError(error: { issues?: Array<{ message: string }> }) {
  return {
    ok: false,
    error: error.issues?.[0]?.message ?? "Los datos enviados no son válidos.",
  } satisfies ActionResult;
}

function rpcError(error: { message: string } | null): ActionResult {
  return error
    ? { ok: false, error: error.message }
    : { ok: true, error: null };
}

export async function separateBox(input: unknown): Promise<ActionResult> {
  const parsed = separateBoxSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("separar_palco", {
    p_palco: parsed.data.palco,
    p_comprador_id: parsed.data.comprador_id,
    p_abono: parsed.data.abono ?? null,
  });

  return error
    ? rpcError(error)
    : { ok: true, error: null, id: data ?? undefined };
}

export async function registerPayment(input: unknown): Promise<ActionResult> {
  const parsed = registerPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registrar_pago", {
    p_pago_id: parsed.data.pago_id,
    p_comprador_id: parsed.data.comprador_id,
    p_monto: parsed.data.monto,
    p_fecha: parsed.data.fecha,
    p_referencia: parsed.data.referencia ?? null,
    p_comprobante_path: parsed.data.comprobante_path ?? null,
    p_nota: parsed.data.nota ?? null,
    p_aplicaciones: parsed.data.aplicaciones,
  });

  return error
    ? rpcError(error)
    : { ok: true, error: null, id: data ?? undefined };
}

export async function cancelPayment(input: unknown): Promise<ActionResult> {
  const parsed = cancelPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("anular_pago", {
    p_pago_id: parsed.data.pago_id,
    p_motivo: parsed.data.motivo,
  });

  return rpcError(error);
}

export async function releaseBox(input: unknown): Promise<ActionResult> {
  const parsed = releaseBoxSchema.safeParse(input);
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("liberar_palco", {
    p_venta_id: parsed.data.venta_id,
    p_motivo: parsed.data.motivo,
    p_devolucion_id: parsed.data.devolucion_id,
    p_fecha_devolucion: parsed.data.fecha_devolucion,
    p_referencia: parsed.data.referencia ?? null,
    p_comprobante_path: parsed.data.comprobante_path ?? null,
  });

  return rpcError(error);
}
