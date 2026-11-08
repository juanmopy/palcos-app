"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const dismissedKey = "palcos-install-prompt-dismissed";

export function InstallAppPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.localStorage.getItem(dismissedKey) === "true",
  );

  useEffect(() => {
    const handleInstallPrompt = (nextEvent: Event) => {
      nextEvent.preventDefault();
      setEvent(nextEvent as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
  }, []);

  if (!event || dismissed) return null;

  async function install() {
    const installEvent = event;
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setEvent(null);
  }

  function dismiss() {
    window.localStorage.setItem(dismissedKey, "true");
    setDismissed(true);
  }

  return (
    <aside className="fixed bottom-20 left-4 right-4 z-50 rounded-lg border border-blue-200 bg-white p-3 shadow-lg sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar aviso de instalación"
        className="absolute right-2 top-2 rounded-md p-1 text-slate-500 hover:bg-slate-100"
      >
        <X aria-hidden="true" size={16} />
      </button>
      <p className="pr-5 text-sm font-semibold text-slate-950">
        Instala Gestión de Palcos
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Ábrela rápidamente desde la pantalla de inicio.
      </p>
      <button
        type="button"
        onClick={install}
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white"
      >
        <Download aria-hidden="true" size={16} />
        Instalar app
      </button>
    </aside>
  );
}
