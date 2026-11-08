import { z } from "zod";

const uuidSchema = z.string().uuid("El identificador no es válido.");
const dateSchema = z.string().date("La fecha no es válida.");

export const initialDepositSchema = z.object({
  pago_id: uuidSchema,
  monto: z.number().int().positive("El monto debe ser mayor que cero."),
  fecha_pago: dateSchema,
  referencia: z.string().trim().optional(),
  comprobante_path: z.string().trim().optional(),
  nota: z.string().trim().optional(),
});

export const separateBoxSchema = z.object({
  palco: z.number().int().min(1).max(120),
  comprador_id: uuidSchema,
  abono: initialDepositSchema.nullable().optional(),
});

export const registerPaymentSchema = z.object({
  pago_id: uuidSchema,
  comprador_id: uuidSchema,
  monto: z.number().int().positive("El monto debe ser mayor que cero."),
  fecha: dateSchema,
  referencia: z.string().trim().optional(),
  comprobante_path: z.string().trim().optional(),
  nota: z.string().trim().optional(),
  aplicaciones: z
    .array(
      z.object({
        venta_id: uuidSchema,
        monto: z.number().int().positive("El monto debe ser mayor que cero."),
      }),
    )
    .min(1, "Debes indicar al menos una aplicación."),
});

export const cancelPaymentSchema = z.object({
  pago_id: uuidSchema,
  motivo: z.string().trim().min(1, "Debes indicar el motivo."),
});

export const releaseBoxSchema = z.object({
  venta_id: uuidSchema,
  motivo: z.string().trim().min(1, "Debes indicar el motivo."),
  devolucion_id: uuidSchema,
  fecha_devolucion: dateSchema,
  referencia: z.string().trim().optional(),
  comprobante_path: z.string().trim().optional(),
});
