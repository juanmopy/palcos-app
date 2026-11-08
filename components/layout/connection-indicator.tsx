"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function ConnectionIndicator() {
  const isOnline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <span
      className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-600"
      title={isOnline ? "Conectado" : "Sin conexión"}
    >
      <span
        aria-hidden="true"
        className={`size-2.5 rounded-full ${
          isOnline ? "bg-emerald-600" : "bg-amber-500"
        }`}
      />
      <span className="hidden sm:inline">
        {isOnline ? "Conectado" : "Sin conexión"}
      </span>
      <span className="sr-only">{isOnline ? "Conectado" : "Sin conexión"}</span>
    </span>
  );
}
