"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { clearLoginAttemptState } from "@/components/auth/login-attempts";

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      return;
    }

    clearLoginAttemptState();
    window.history.replaceState(null, "", "/login");
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      aria-label="Cambiar de persona / Salir"
      title="Cambiar de persona / Salir"
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
    >
      <LogOut aria-hidden="true" size={18} />
      <span className="hidden sm:inline">
        {isSigningOut ? "Saliendo..." : "Cambiar de persona / Salir"}
      </span>
    </button>
  );
}
