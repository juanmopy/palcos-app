"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <section className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-xl font-bold text-red-900">
          No se pudo cargar esta pantalla
        </h1>
        <p className="mt-2 text-sm text-red-800">
          Ocurrió un error inesperado. Intenta nuevamente.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 min-h-11 rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-900 focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:outline-none"
        >
          Reintentar
        </button>
      </section>
    </main>
  );
}
