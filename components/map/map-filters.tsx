"use client";

import { Search, SlidersHorizontal } from "lucide-react";

import type { BoxCategory, BoxStatus } from "@/components/map/types";

type MapFiltersProps = {
  status: BoxStatus | "todos";
  category: BoxCategory | "todos";
  search: string;
  onStatusChange: (status: BoxStatus | "todos") => void;
  onCategoryChange: (category: BoxCategory | "todos") => void;
  onSearchChange: (search: string) => void;
};

const statuses: { value: BoxStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "disponible", label: "Disponibles" },
  { value: "separado", label: "Separados" },
  { value: "pagado", label: "Pagados" },
];

const categories: { value: BoxCategory | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los colores" },
  { value: "azul", label: "Azul" },
  { value: "amarillo", label: "Amarillo" },
  { value: "rojo", label: "Rojo" },
  { value: "verde", label: "Verde" },
];

function chipClass(active: boolean) {
  return `min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none ${
    active
      ? "border-blue-700 bg-blue-700 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50"
  }`;
}

export function MapFilters({
  status,
  category,
  search,
  onStatusChange,
  onCategoryChange,
  onSearchChange,
}: MapFiltersProps) {
  return (
    <section
      aria-label="Filtros del mapa"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm font-bold text-slate-950">
        <SlidersHorizontal aria-hidden="true" size={18} />
        Filtrar palcos
      </div>
      <div className="flex flex-wrap gap-2">
        {statuses.map((item) => (
          <button
            key={item.value}
            type="button"
            className={chipClass(status === item.value)}
            aria-pressed={status === item.value}
            onClick={() => onStatusChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            className={chipClass(category === item.value)}
            aria-pressed={category === item.value}
            onClick={() => onCategoryChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <label className="relative block">
        <span className="sr-only">Buscar por número, nombre o documento</span>
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={19}
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar número, nombre o documento"
          className="min-h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-base text-slate-950 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-700"
        />
      </label>
    </section>
  );
}
