"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { editBuyer } from "@/lib/actions/box-actions";
import { useOffline } from "@/components/pwa/offline-banner";

type BuyerEditFormProps = {
  buyer: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    document: string | null;
    phone: string;
    recommendedBy: string | null;
  };
  onCancel: () => void;
  onSuccess: () => void;
};

export function BuyerEditForm({
  buyer,
  onCancel,
  onSuccess,
}: BuyerEditFormProps) {
  const { isOffline } = useOffline();
  const [name, setName] = useState(buyer.firstName);
  const [lastName, setLastName] = useState(buyer.lastName);
  const [document, setDocument] = useState(buyer.document ?? "");
  const [phone, setPhone] = useState(buyer.phone.replace(/^\+57/, ""));
  const [recommendedBy, setRecommendedBy] = useState(buyer.recommendedBy ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !lastName.trim()) {
      setFieldError("Nombre y apellido son obligatorios.");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setFieldError("El teléfono debe tener 10 dígitos después de +57.");
      return;
    }
    setFieldError(null);
    setIsSubmitting(true);
    const result = await editBuyer({
      id: buyer.id,
      nombre: name,
      apellido: lastName,
      documento: document || null,
      telefono: phone,
      recomendado_por: recommendedBy,
    });
    setIsSubmitting(false);
    if (!result.ok) {
      toast.error(result.error ?? "No se pudo editar el comprador.");
      return;
    }
    toast.success("Comprador actualizado.");
    onSuccess();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="text-xl font-bold text-slate-950">Editar comprador</h3>
      <Field
        label="Nombre *"
        value={name}
        onChange={setName}
        onBlur={() =>
          setFieldError(!name.trim() ? "El nombre es obligatorio." : null)
        }
      />
      <Field
        label="Apellido *"
        value={lastName}
        onChange={setLastName}
        onBlur={() =>
          setFieldError(!lastName.trim() ? "El apellido es obligatorio." : null)
        }
      />
      <Field
        label="Documento (opcional)"
        value={document}
        onChange={setDocument}
        inputMode="numeric"
      />
      <Field
        label="Teléfono +57 *"
        value={phone}
        onChange={setPhone}
        inputMode="tel"
        onBlur={() =>
          setFieldError(
            !/^\d{10}$/.test(phone)
              ? "El teléfono debe tener 10 dígitos después de +57."
              : null,
          )
        }
      />
      <Field
        label="Recomendado por"
        value={recommendedBy}
        onChange={setRecommendedBy}
      />
      {fieldError ? (
        <p className="text-sm text-red-700" role="alert">
          {fieldError}
        </p>
      ) : null}
      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white pt-5">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isOffline}>
          {isSubmitting ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  inputMode,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric" | "tel";
  onBlur?: () => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
      />
    </label>
  );
}
