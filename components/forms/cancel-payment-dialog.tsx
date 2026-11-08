"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cancelPayment } from "@/lib/actions/box-actions";
import { conflictMessage, isConflictError } from "@/lib/realtime";

type CancelPaymentDialogProps = {
  paymentId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function CancelPaymentDialog({
  paymentId,
  onClose,
  onSuccess,
}: CancelPaymentDialogProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) {
      toast.error("Debes indicar el motivo de la anulación.");
      return;
    }
    setIsSubmitting(true);
    const result = await cancelPayment({ pago_id: paymentId, motivo: reason });
    setIsSubmitting(false);
    if (!result.ok) {
      const message = isConflictError(result.error)
        ? conflictMessage
        : (result.error ?? "No se pudo anular el abono.");
      toast.error(message);
      if (isConflictError(result.error)) {
        router.refresh();
      }
      return;
    }
    toast.success("Abono anulado.");
    onSuccess();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-payment-title"
      >
        <h2 id="cancel-payment-title" className="text-xl font-bold">
          Anular abono
        </h2>
        <label className="mt-4 block">
          <span className="text-sm font-medium">Motivo *</span>
          <textarea
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="destructive" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Anular abono"}
          </Button>
        </div>
      </form>
    </div>
  );
}
