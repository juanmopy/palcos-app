export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-[50vh] animate-pulse rounded-xl bg-white shadow-sm" />
    </div>
  );
}
