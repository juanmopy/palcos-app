"use client";

export default function SummaryError({ reset }: { reset: () => void }) {
  return (
    <section className="rounded-xl border border-red-200 bg-white p-8 text-center">
      <h1 className="text-xl font-bold text-slate-950">
        No pudimos cargar el resumen
      </h1>
      <p className="mt-2 text-slate-600">
        Revisa la conexión e inténtalo de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 min-h-11 rounded-lg bg-blue-700 px-4 font-semibold text-white"
      >
        Reintentar
      </button>
    </section>
  );
}
