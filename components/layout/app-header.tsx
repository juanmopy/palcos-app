import { UserCircle } from "lucide-react";

import { ConnectionIndicator } from "@/components/layout/connection-indicator";
import { SignOutButton } from "@/components/auth/sign-out-button";

type AppHeaderProps = {
  activeUser: {
    nombre: string;
    iniciales: string;
    color_avatar: string;
  } | null;
};

export function AppHeader({ activeUser }: AppHeaderProps) {
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || "Gestión de Palcos";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-950 sm:text-lg">
            {eventName}
          </p>
          <p className="text-xs text-slate-500">Gestión de palcos</p>
        </div>

        <div className="flex items-center gap-3">
          <ConnectionIndicator />
          <div className="hidden items-center gap-2 sm:flex">
            {activeUser ? (
              <>
                <span
                  className="flex size-9 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: activeUser.color_avatar }}
                >
                  {activeUser.iniciales}
                </span>
                <span className="max-w-28 truncate text-sm font-medium text-slate-700">
                  {activeUser.nombre}
                </span>
              </>
            ) : (
              <UserCircle
                aria-hidden="true"
                className="text-slate-400"
                size={28}
              />
            )}
          </div>
          <div className="hidden lg:block">
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
