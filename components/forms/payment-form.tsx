"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AllocationEditor, type AllocationSale } from "./allocation-editor";
import { ReceiptUploader } from "./receipt-uploader";
import { Button } from "@/components/ui/button";
import { formatCOP, parseCOP } from "@/lib/format";
import { registerPayment } from "@/lib/actions/box-actions";

type PaymentFormProps = {
  buyerId: string;
  sales: AllocationSale[];
  initialSaleId: string;
  onCancel: () => void;
  onSuccess: () => void;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({
  buyerId,
  sales,
  initialSaleId,
  onCancel,
  onSuccess,
}: PaymentFormProps) {
  const paymentId = useMemo(() => crypto.randomUUID(), []);
  const initialSale = sales.find((sale) => sale.venta_id === initialSaleId);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(today);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [amountError, setAmountError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeAmount(nextAmount: number) {
    setAmount(nextAmount);
    setAllocations(initialSale ? { [initialSale.venta_id]: nextAmount } : {});
  }

  function changeAllocation(saleId: string, value: number) {
    setAllocations((current) => ({ ...current, [saleId]: value }));
  }

  function autoAllocate() {
    let remaining = amount;
    const next: Record<string, number> = {};
    for (const sale of [...sales].sort(
      (left, right) => left.palco_numero - right.palco_numero,
    )) {
      const applied = Math.min(remaining, sale.saldo);
      next[sale.venta_id] = applied;
      remaining -= applied;
    }
    setAllocations(next);
  }

  function validate() {
    const nextAmountError =
      amount <= 0 ? "El monto debe ser mayor que cero." : null;
    const nextDateError =
      date > today() ? "La fecha no puede ser futura." : null;
    const overSaldo = sales.find(
      (sale) => (allocations[sale.venta_id] ?? 0) > sale.saldo,
    );
    const assigned = Object.values(allocations).reduce(
      (sum, value) => sum + value,
      0,
    );
    const allocationError = overSaldo
      ? `El monto del palco ${overSaldo.palco_numero} supera su saldo.`
      : assigned !== amount
        ? "La suma repartida debe coincidir con el monto."
        : null;
    setAmountError(nextAmountError);
    setDateError(nextDateError);
    return !nextAmountError && !nextDateError && !allocationError
      ? null
      : (allocationError ?? nextAmountError ?? nextDateError);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    const result = await registerPayment({
      pago_id: paymentId,
      comprador_id: buyerId,
      monto: amount,
      fecha: date,
      referencia: reference,
      nota: note,
      comprobante_path: receiptPath,
      aplicaciones: Object.entries(allocations)
        .filter(([, value]) => value > 0)
        .map(([venta_id, monto]) => ({ venta_id, monto })),
    });
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "No se pudo registrar el abono.");
      return;
    }

    toast.success(`Abono de ${formatCOP(amount)} registrado.`);
    onSuccess();
  }

  const assigned = Object.values(allocations).reduce(
    (sum, value) => sum + value,
    0,
  );
  const canSubmit = !isSubmitting && amount > 0 && assigned === amount;

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-950">Registrar abono</h3>
        <p className="mt-1 text-sm text-slate-600">
          El pago se confirmará en el servidor antes de actualizar el mapa.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-slate-900">Monto *</span>
        <input
          type="text"
          inputMode="numeric"
          value={amount ? formatCOP(amount) : ""}
          onChange={(event) => changeAmount(parseCOP(event.target.value))}
          onBlur={() =>
            setAmountError(
              amount <= 0 ? "El monto debe ser mayor que cero." : null,
            )
          }
          className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          aria-invalid={Boolean(amountError)}
        />
        {amountError ? (
          <span className="mt-1 block text-sm text-red-700">{amountError}</span>
        ) : null}
      </label>

      <button
        type="button"
        onClick={() => changeAmount(initialSale?.saldo ?? 0)}
        className="min-h-11 rounded-lg border border-blue-200 px-3 text-sm font-semibold text-blue-800 hover:bg-blue-50"
      >
        Pagar saldo completo
      </button>

      <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
        Nuevo saldo:{" "}
        {formatCOP(Math.max(0, (initialSale?.saldo ?? 0) - amount))}
      </p>

      <label className="block">
        <span className="text-sm font-medium text-slate-900">
          Fecha del pago *
        </span>
        <input
          type="date"
          max={today()}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          onBlur={() =>
            setDateError(
              date > today() ? "La fecha no puede ser futura." : null,
            )
          }
          className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          aria-invalid={Boolean(dateError)}
        />
        {dateError ? (
          <span className="mt-1 block text-sm text-red-700">{dateError}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-900">Referencia</span>
        <input
          type="text"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-900">Nota</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        />
      </label>

      <ReceiptUploader paymentId={paymentId} onUploaded={setReceiptPath} />

      {sales.length > 1 ? (
        <AllocationEditor
          sales={sales}
          allocations={allocations}
          total={amount}
          onChange={changeAllocation}
          onAutoAllocate={autoAllocate}
        />
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Guardando..." : "Registrar abono"}
        </Button>
      </div>
      {!canSubmit && !isSubmitting ? (
        <p className="text-sm text-slate-600">
          Completa el monto y asigna todo el pago antes de guardar.
        </p>
      ) : null}
    </form>
  );
}
