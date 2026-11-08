"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createBuyer, separateBox } from "@/lib/actions/box-actions";
import { formatCOP, parseCOP } from "@/lib/format";
import { conflictMessage, isConflictError } from "@/lib/realtime";

import { ReceiptUploader } from "./receipt-uploader";

export type BuyerOption = {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
};

type ReserveFormProps = {
  palco: number;
  categoryName: string;
  price: number;
  buyers: BuyerOption[];
  recommendations: string[];
  onCancel: () => void;
  onSuccess: () => void;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ReserveForm({
  palco,
  categoryName,
  price,
  buyers,
  recommendations,
  onCancel,
  onSuccess,
}: ReserveFormProps) {
  const router = useRouter();
  const paymentId = useMemo(() => crypto.randomUUID(), []);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState("");
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [recommendedBy, setRecommendedBy] = useState("");
  const [initialDeposit, setInitialDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositDate, setDepositDate] = useState(today);
  const [depositReference, setDepositReference] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBuyer = buyers.find((buyer) => buyer.id === selectedBuyerId);
  const filteredBuyers = buyers.filter((buyer) =>
    `${buyer.nombre} ${buyer.apellido} ${buyer.documento}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  );

  function chooseBuyer(buyer: BuyerOption) {
    setSelectedBuyerId(buyer.id);
    setName(buyer.nombre);
    setLastName(buyer.apellido);
    setDocument(buyer.documento);
    setPhone(buyer.telefono.replace(/^\+57/, ""));
    setError(null);
  }

  function validateBuyer() {
    if (selectedBuyerId) {
      return true;
    }
    if (!name.trim() || !lastName.trim()) {
      setError("Nombre y apellido son obligatorios.");
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("El teléfono debe tener 10 dígitos después de +57.");
      return false;
    }
    if (!document.trim()) {
      setError("El documento es obligatorio.");
      return false;
    }
    const duplicate = buyers.find(
      (buyer) => buyer.documento === document.trim(),
    );
    if (duplicate) {
      setError("Ese documento ya existe. Selecciona el comprador encontrado.");
      return false;
    }
    return true;
  }

  function nextFromBuyer() {
    if (!validateBuyer()) {
      return;
    }
    setError(null);
    setStep(2);
  }

  function nextFromDeposit() {
    if (
      initialDeposit &&
      (depositAmount <= 0 || depositAmount > price || depositDate > today())
    ) {
      setError(
        depositAmount <= 0
          ? "El monto del abono debe ser mayor que cero."
          : depositAmount > price
            ? "El abono no puede superar el precio del palco."
            : "La fecha no puede ser futura.",
      );
      return;
    }
    setError(null);
    setStep(3);
  }

  async function submit() {
    setIsSubmitting(true);
    setError(null);
    let buyerId = selectedBuyerId;

    if (!buyerId) {
      const buyerResult = await createBuyer({
        nombre: name,
        apellido: lastName,
        documento: document,
        telefono: phone,
        recomendado_por: recommendedBy,
      });
      if (!buyerResult.ok || !buyerResult.id) {
        setIsSubmitting(false);
        const message = buyerResult.error ?? "No se pudo crear el comprador.";
        setError(message);
        toast.error(message);
        return;
      }
      buyerId = buyerResult.id;
    }

    const result = await separateBox({
      palco,
      comprador_id: buyerId,
      abono: initialDeposit
        ? {
            pago_id: paymentId,
            monto: depositAmount,
            fecha_pago: depositDate,
            referencia: depositReference,
            comprobante_path: receiptPath ?? undefined,
            nota: depositNote,
          }
        : null,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      const message = isConflictError(result.error)
        ? conflictMessage
        : (result.error ?? "No se pudo separar el palco.");
      setError(message);
      toast.error(message);
      if (isConflictError(result.error)) {
        router.refresh();
      }
      return;
    }

    toast.success(`Palco ${palco} separado correctamente.`);
    onSuccess();
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Separar palco {palco}
        </p>
        <h3 className="mt-1 text-xl font-bold text-slate-950">
          {categoryName} · {formatCOP(price)}
        </h3>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              ¿Ya existe? Búscalo
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              placeholder="Nombre o documento"
            />
          </label>
          {search && filteredBuyers.length > 0 ? (
            <div className="space-y-2" role="listbox" aria-label="Compradores">
              {filteredBuyers.slice(0, 5).map((buyer) => (
                <button
                  key={buyer.id}
                  type="button"
                  onClick={() => chooseBuyer(buyer)}
                  className="min-h-12 w-full rounded-lg border border-slate-200 px-4 text-left text-sm hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
                >
                  <span className="font-semibold">
                    {buyer.nombre} {buyer.apellido}
                  </span>{" "}
                  · {buyer.documento}
                </button>
              ))}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre *"
              value={name}
              onChange={setName}
              autoComplete="given-name"
              onBlur={() =>
                setError(!name.trim() ? "El nombre es obligatorio." : null)
              }
            />
            <Field
              label="Apellido *"
              value={lastName}
              onChange={setLastName}
              autoComplete="family-name"
              onBlur={() =>
                setError(
                  !lastName.trim() ? "El apellido es obligatorio." : null,
                )
              }
            />
          </div>
          <Field
            label="Documento *"
            value={document}
            onChange={(value) => setDocument(value.replace(/\D/g, ""))}
            inputMode="numeric"
            onBlur={() =>
              setError(!document.trim() ? "El documento es obligatorio." : null)
            }
          />
          <Field
            label="Teléfono *"
            value={phone}
            onChange={(value) =>
              setPhone(value.replace(/\D/g, "").slice(0, 10))
            }
            inputMode="tel"
            type="tel"
            prefix="+57"
            onBlur={() =>
              setError(
                !/^\d{10}$/.test(phone)
                  ? "El teléfono debe tener 10 dígitos después de +57."
                  : null,
              )
            }
          />
          <label className="block">
            <span className="text-sm font-medium text-slate-900">
              Recomendado por
            </span>
            <input
              list="recommendations"
              value={recommendedBy}
              onChange={(event) => setRecommendedBy(event.target.value)}
              className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            />
            <datalist id="recommendations">
              {recommendations.map((recommendation) => (
                <option key={recommendation} value={recommendation} />
              ))}
            </datalist>
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 p-3 text-base">
            <input
              type="checkbox"
              checked={initialDeposit}
              onChange={(event) => setInitialDeposit(event.target.checked)}
              className="size-5"
            />
            Registrar un abono ahora
          </label>
          {initialDeposit ? (
            <>
              <Field
                label="Monto del abono *"
                value={depositAmount ? formatCOP(depositAmount) : ""}
                onChange={(value) => setDepositAmount(parseCOP(value))}
                inputMode="numeric"
                onBlur={() =>
                  setError(
                    depositAmount <= 0
                      ? "El monto del abono debe ser mayor que cero."
                      : depositAmount > price
                        ? "El abono no puede superar el precio del palco."
                        : null,
                  )
                }
              />
              <p className="text-sm text-slate-600">
                Saldo después del abono:{" "}
                {formatCOP(Math.max(0, price - depositAmount))}
              </p>
              <label className="block">
                <span className="text-sm font-medium text-slate-900">
                  Fecha del pago *
                </span>
                <input
                  type="date"
                  max={today()}
                  value={depositDate}
                  onChange={(event) => setDepositDate(event.target.value)}
                  onBlur={() =>
                    setError(
                      depositDate > today()
                        ? "La fecha no puede ser futura."
                        : null,
                    )
                  }
                  className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                />
              </label>
              <Field
                label="Referencia"
                value={depositReference}
                onChange={setDepositReference}
              />
              <Field
                label="Nota"
                value={depositNote}
                onChange={setDepositNote}
              />
              <ReceiptUploader
                paymentId={paymentId}
                onUploaded={setReceiptPath}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-slate-950">Confirmación</p>
          <p className="mt-2">
            Palco {palco} · {categoryName} · {formatCOP(price)}
          </p>
          <p>
            Para: {selectedBuyer?.nombre ?? name}{" "}
            {selectedBuyer?.apellido ?? lastName}
          </p>
          <p>
            Abono inicial: {initialDeposit ? formatCOP(depositAmount) : "No"}
          </p>
        </div>
      ) : null}

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((step - 1) as 1 | 2)}
          >
            Atrás
          </Button>
        ) : null}
        {step === 1 ? (
          <Button type="button" onClick={nextFromBuyer}>
            Continuar
          </Button>
        ) : step === 2 ? (
          <Button type="button" onClick={nextFromDeposit}>
            Revisar
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Confirmar separación"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  autoComplete,
  prefix,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "numeric" | "tel";
  autoComplete?: string;
  prefix?: string;
  onBlur?: () => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <span className="mt-1 flex min-h-12 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-blue-700">
        {prefix ? (
          <span className="flex items-center border-r border-slate-200 px-3 text-base text-slate-600">
            {prefix}
          </span>
        ) : null}
        <input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-4 text-base text-slate-950 outline-none"
        />
      </span>
    </label>
  );
}
