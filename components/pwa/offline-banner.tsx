"use client";

import { WifiOff } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";

type OfflineContextValue = { isOffline: boolean };

const OfflineContext = createContext<OfflineContextValue>({ isOffline: false });

export function useOffline() {
  return useContext(OfflineContext);
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    updateStatus();
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
      {isOffline ? (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-lg sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm sm:rounded-lg sm:border"
        >
          <div className="flex items-start gap-3">
            <WifiOff aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-semibold">Sin conexión</p>
              <p className="mt-1 text-sm">
                Las acciones que guardan cambios están deshabilitadas hasta
                recuperar internet.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </OfflineContext.Provider>
  );
}
