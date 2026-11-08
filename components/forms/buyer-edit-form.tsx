"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { editBuyer } from "@/lib/actions/box-actions";

type BuyerEditFormProps = {
  buyer: {
    id: string;
    name: string;
    document: string;
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
  const [name, setName] = useState(buyer.name.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(
    buyer.name.split(" ").slice(1).join(" "),
  );
  const [document, setDocument] = useState(buyer.document);
  const [phone, setPhone] = useState(buyer.phone.replace(/^\+57/, ""));
  const [recommendedBy, setRecommendedBy] = useState(buyer.recommendedBy ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await editBuyer({
      id: buyer.id,
      nombre: name,
      apellido: lastName,
      documento: document,
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
      <Field label="Nombre *" value={name} onChange={setName} />
      <Field label="Apellido *" value={lastName} onChange={setLastName} />
      <Field
        label="Documento *"
        value={document}
        onChange={setDocument}
        inputMode="numeric"
      />
      <Field
        label="Teléfono +57 *"
        value={phone}
        onChange={setPhone}
        inputMode="tel"
      />
      <Field
        label="Recomendado por"
        value={recommendedBy}
        onChange={setRecommendedBy}
      />
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric" | "tel";
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-12 w-full rounded-lg border border-slate-300 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
      />
    </label>
  );
}
