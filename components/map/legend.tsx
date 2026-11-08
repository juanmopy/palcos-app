import { Check, Clock3 } from "lucide-react";

const categories = [
  { id: "azul", label: "Azul", price: "$ 15.000.000", color: "bg-azul-base" },
  {
    id: "amarillo",
    label: "Amarillo",
    price: "$ 12.000.000",
    color: "bg-amarillo-base",
  },
  { id: "rojo", label: "Rojo", price: "$ 10.000.000", color: "bg-rojo-base" },
  { id: "verde", label: "Verde", price: "$ 8.000.000", color: "bg-verde-base" },
];

export function Legend() {
  return (
    <section
      aria-label="Leyenda del mapa"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-sm font-bold text-slate-950">Leyenda</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2 text-sm">
            <span
              className={`size-4 rounded ${category.color}`}
              aria-hidden="true"
            />
            <span className="font-medium text-slate-800">{category.label}</span>
            <span className="text-slate-500">{category.price}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded border border-slate-500 bg-slate-100" />
          Disponible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded border-2 border-dashed border-slate-500 bg-slate-500" />
          <Clock3 aria-hidden="true" size={13} />
          Separado
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded bg-slate-700" />
          <Check aria-hidden="true" size={13} />
          Pagado
        </span>
      </div>
    </section>
  );
}
