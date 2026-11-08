import { SignOutButton } from "@/components/auth/sign-out-button";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
              Gestión de Palcos
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Sesión iniciada
            </h1>
            <p className="mt-2 text-slate-600">
              El mapa y la gestión del evento estarán disponibles en los
              siguientes pasos.
            </p>
          </div>
          <SignOutButton />
        </div>
      </section>
    </main>
  );
}
