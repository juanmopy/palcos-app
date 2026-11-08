"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { releaseBox } from "@/lib/actions/box-actions";
import { formatCOP } from "@/lib/format";

import { ReceiptUploader } from "./receipt-uploader";

type ReleaseDialogProps = {
  open: boolean;
  boxNumber: number;
  saleId: string;
  refundAmount: number;
  buyerName: string;
  onClose: () => void;
  onSuccess: () => void;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ReleaseDialog({
  open,
  boxNumber,
  saleId,
  refundAmount,
  buyerName,
  onClose,
  onSuccess,
}: ReleaseDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const refundId = useMemo(() => crypto.randomUUID(), []);
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) {
      toast.error("Debes indicar el motivo de la liberación.");
      return;
    }
    setIsSubmitting(true);
    const result = await releaseBox({
      venta_id: saleId,
      motivo: reason,
      devolucion_id: refundId,
      fecha_devolucion: date,
      referencia: reference,
      comprobante_path: receiptPath,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      toast.error(result.error ?? "No se pudo liberar el palco.");
      return;
    }
    toast.success(`Palco ${boxNumber} liberado.`);
    onSuccess();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="release-title"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="release-title" className="text-xl font-bold text-slate-950">
          Liberar palco {boxNumber}
        </h2>
        <p className="mt-3 text-sm text-slate-700">
          Se liberará el palco y se registrará una devolución de{" "}
          <strong>{formatCOP(refundAmount)}</strong> a {buyerName}. Esta acción
          no se puede deshacer.
        </p>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-slate-900">Motivo *</span>
          <textarea
            required
            autoFocus={false}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-900">
            Fecha de devolución *
          </span>
          <input
            required
            type="date"
            max={today()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-900">
            Referencia de la transferencia
          </span>
          <input
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          />
        </label>
        <div className="mt-4">
          <ReceiptUploader
            paymentId={refundId}
            folder="devoluciones"
            onUploaded={setReceiptPath}
          />
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="destructive" disabled={isSubmitting}>
            {isSubmitting
              ? "Guardando..."
              : `Liberar palco ${boxNumber} y devolver ${formatCOP(refundAmount)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
