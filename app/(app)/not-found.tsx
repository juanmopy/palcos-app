import Link from "next/link";

export default function AppNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <section className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-blue-800">404</p>
        <h1 className="mt-2 text-xl font-bold text-slate-950">
          No encontramos esta página
        </h1>
        <p className="mt-2 text-slate-600">
          Revisa la dirección o vuelve al mapa de palcos.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
        >
          Ir al mapa
        </Link>
      </section>
    </main>
  );
}
