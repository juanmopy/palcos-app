import { z } from "zod";

const uuidSchema = z.string().uuid("El identificador no es válido.");
const dateSchema = z.string().date("La fecha no es válida.");
const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, "El teléfono debe tener 10 dígitos después de +57.");
const documentSchema = z
  .string()
  .trim()
  .min(3, "El documento es obligatorio.")
  .max(30, "El documento es demasiado largo.");

export const buyerSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  apellido: z.string().trim().min(1, "El apellido es obligatorio."),
  documento: documentSchema,
  telefono: phoneSchema,
  recomendado_por: z.string().trim().optional(),
});

export const initialDepositSchema = z.object({
  pago_id: uuidSchema,
  monto: z.number().int().positive("El monto debe ser mayor que cero."),
  fecha_pago: dateSchema,
  referencia: z.string().trim().nullable().optional(),
  comprobante_path: z.string().trim().nullable().optional(),
  nota: z.string().trim().nullable().optional(),
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
  referencia: z.string().trim().nullable().optional(),
  comprobante_path: z.string().trim().nullable().optional(),
  nota: z.string().trim().nullable().optional(),
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
  referencia: z.string().trim().nullable().optional(),
  comprobante_path: z.string().trim().nullable().optional(),
});

export const editBuyerSchema = buyerSchema.extend({
  id: uuidSchema,
});
