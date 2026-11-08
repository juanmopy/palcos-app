"use client";

import { Check, Clock3 } from "lucide-react";

import type { BoxStatus, VenueBox } from "@/components/map/types";

type BoxCellProps = {
  box: VenueBox;
  tabIndex: number;
  onClick: (box: VenueBox) => void;
  onKeyDown: (
    event: React.KeyboardEvent<HTMLButtonElement>,
    box: VenueBox,
  ) => void;
};

const categoryStyles = {
  azul: {
    disponible: "border-azul-base bg-azul-tint text-blue-950",
    separado: "border-azul-base bg-azul-base text-white",
    pagado: "border-azul-dark bg-azul-dark text-white",
  },
  amarillo: {
    disponible: "border-amarillo-dark bg-amarillo-tint text-yellow-950",
    separado: "border-amarillo-dark bg-amarillo-base text-slate-950",
    pagado: "border-amarillo-dark bg-amarillo-dark text-slate-950",
  },
  rojo: {
    disponible: "border-rojo-base bg-rojo-tint text-red-950",
    separado: "border-rojo-base bg-rojo-base text-white",
    pagado: "border-rojo-dark bg-rojo-dark text-white",
  },
  verde: {
    disponible: "border-verde-base bg-verde-tint text-green-950",
    separado: "border-verde-base bg-verde-base text-slate-950",
    pagado: "border-verde-dark bg-verde-dark text-white",
  },
} as const satisfies Record<string, Record<BoxStatus, string>>;

function formatPrice(value: number | null) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function getCategory(box: VenueBox) {
  return box.categoria_id === "azul" ||
    box.categoria_id === "amarillo" ||
    box.categoria_id === "rojo" ||
    box.categoria_id === "verde"
    ? box.categoria_id
    : "azul";
}

function getStatus(box: VenueBox): BoxStatus {
  return box.estado === "separado" || box.estado === "pagado"
    ? box.estado
    : "disponible";
}

function getAriaLabel(box: VenueBox, status: BoxStatus) {
  const category = box.categoria_nombre ?? getCategory(box);
  const price = formatPrice(box.precio);

  if (status === "disponible") {
    return `Palco ${box.numero}, ${category}, ${price}, disponible`;
  }

  if (status === "pagado") {
    return `Palco ${box.numero}, ${category}, ${price}, pagado por ${
      box.comprador_nombre_completo ?? "comprador"
    }, 100% abonado`;
  }

  return `Palco ${box.numero}, ${category}, ${price}, separado por ${
    box.comprador_nombre_completo ?? "comprador"
  }, ${box.porcentaje ?? 0}% abonado`;
}

export function BoxCell({ box, tabIndex, onClick, onKeyDown }: BoxCellProps) {
  const category = getCategory(box);
  const status = getStatus(box);
  const percentage = Math.min(100, Math.max(0, box.porcentaje ?? 0));

  return (
    <button
      type="button"
      id={`palco-${box.numero}`}
      tabIndex={tabIndex}
      aria-label={getAriaLabel(box, status)}
      onClick={() => onClick(box)}
      onKeyDown={(event) => onKeyDown(event, box)}
      className={`relative flex min-h-8 min-w-8 items-center justify-center overflow-hidden rounded-md border text-xs font-bold tabular-nums transition-[opacity,transform] hover:scale-105 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 focus-visible:outline-none sm:min-h-11 sm:min-w-11 sm:text-sm ${
        categoryStyles[category][status]
      } ${status === "separado" ? "border-dashed border-2" : "border"}`}
    >
      <span>{box.numero}</span>
      {status === "separado" ? (
        <>
          <Clock3
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 size-2.5 sm:size-3"
          />
          <span className="absolute inset-x-1 bottom-0.5 h-1 overflow-hidden rounded-full bg-slate-900/30">
            <span
              className="block h-full rounded-full bg-slate-900/70"
              style={{ width: `${percentage}%` }}
            />
          </span>
        </>
      ) : null}
      {status === "pagado" ? (
        <Check
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 size-3 sm:size-3.5"
          strokeWidth={3}
        />
      ) : null}
    </button>
  );
}
