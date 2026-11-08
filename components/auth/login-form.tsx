"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { useOffline } from "@/components/pwa/offline-banner";

export type LoginUser = {
  id: string;
  nombre: string;
  iniciales: string;
  color_avatar: string;
  orden: number;
  email_login: string;
};

type LoginFormProps = {
  users: LoginUser[];
  initialErrorMessage: string | null;
};

type LoginAttemptState = {
  failedAttempts: number;
  lockedUntil: number | null;
};

const ATTEMPTS_STORAGE_KEY = "palcos-login-attempts";
const LOCKOUT_DURATION_MS = 5 * 60 * 1000;

function readAttemptState(): LoginAttemptState {
  try {
    const value = window.localStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!value) {
      return { failedAttempts: 0, lockedUntil: null };
    }

    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("failedAttempts" in parsed) ||
      typeof parsed.failedAttempts !== "number" ||
      !("lockedUntil" in parsed) ||
      (parsed.lockedUntil !== null && typeof parsed.lockedUntil !== "number")
    ) {
      return { failedAttempts: 0, lockedUntil: null };
    }

    return {
      failedAttempts: parsed.failedAttempts,
      lockedUntil: parsed.lockedUntil,
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: null };
  }
}

function saveAttemptState(state: LoginAttemptState) {
  window.localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(state));
}

function formatRemainingTime(lockedUntil: number) {
  return Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000));
}

export function LoginForm({ users, initialErrorMessage }: LoginFormProps) {
  const router = useRouter();
  const { isOffline } = useOffline();
  const pinInputRef = useRef<HTMLInputElement>(null);
  const [selectedUser, setSelectedUser] = useState<LoginUser | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptState, setAttemptState] = useState<LoginAttemptState>(() => {
    if (typeof window === "undefined") {
      return { failedAttempts: 0, lockedUntil: null };
    }

    const state = readAttemptState();
    return state.lockedUntil && state.lockedUntil <= Date.now()
      ? { failedAttempts: 0, lockedUntil: null }
      : state;
  });

  useEffect(() => {
    const state = readAttemptState();
    if (state.lockedUntil && state.lockedUntil <= Date.now()) {
      saveAttemptState({ failedAttempts: 0, lockedUntil: null });
    }
  }, []);

  useEffect(() => {
    if (!attemptState.lockedUntil) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        const unlockedState = { failedAttempts: 0, lockedUntil: null };
        saveAttemptState(unlockedState);
        setAttemptState(unlockedState);
      },
      Math.max(0, attemptState.lockedUntil - Date.now()),
    );

    return () => window.clearTimeout(timeout);
  }, [attemptState.lockedUntil]);

  useEffect(() => {
    if (selectedUser) {
      pinInputRef.current?.focus();
    }
  }, [selectedUser]);

  function selectUser(user: LoginUser) {
    setSelectedUser(user);
    setPin("");
    setShowPin(false);
    setErrorMessage(
      isLocked && attemptState.lockedUntil
        ? `Demasiados intentos. Intenta de nuevo en ${formatRemainingTime(attemptState.lockedUntil)} min.`
        : null,
    );
  }

  function clearSelection() {
    setSelectedUser(null);
    setPin("");
    setShowPin(false);
    setErrorMessage(null);
  }

  async function submitPin(pinToSubmit: string) {
    if (
      isOffline ||
      !selectedUser ||
      isSubmitting ||
      pinToSubmit.length !== 6
    ) {
      return;
    }

    const currentState = readAttemptState();
    if (currentState.lockedUntil && currentState.lockedUntil > Date.now()) {
      setAttemptState(currentState);
      setErrorMessage(
        `Demasiados intentos. Intenta de nuevo en ${formatRemainingTime(currentState.lockedUntil)} min.`,
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: selectedUser.email_login,
      password: pinToSubmit,
    });

    if (!error) {
      saveAttemptState({ failedAttempts: 0, lockedUntil: null });
      router.replace("/");
      router.refresh();
      return;
    }

    const failedAttempts = currentState.failedAttempts + 1;
    if (failedAttempts >= 5) {
      const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      const lockedState = { failedAttempts, lockedUntil };
      saveAttemptState(lockedState);
      setAttemptState(lockedState);
      setErrorMessage(
        "PIN incorrecto. Se bloquearon los intentos durante 5 minutos en este dispositivo.",
      );
    } else {
      const nextState = { failedAttempts, lockedUntil: null };
      saveAttemptState(nextState);
      setAttemptState(nextState);
      setErrorMessage(
        `PIN incorrecto. Te quedan ${5 - failedAttempts} intentos.`,
      );
    }

    setPin("");
    setIsSubmitting(false);
    pinInputRef.current?.focus();
  }

  function handlePinChange(value: string) {
    const nextPin = value.replace(/\D/g, "").slice(0, 6);
    setPin(nextPin);
    if (nextPin.length === 6) {
      void submitPin(nextPin);
    }
  }

  const isLocked = attemptState.lockedUntil !== null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-800">
            <LockKeyhole aria-hidden="true" size={24} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            Gestión de Palcos
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            ¿Quién eres?
          </h1>
          <p className="mt-2 text-slate-600">
            Selecciona tu nombre para ingresar con tu PIN.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectUser(user)}
              className={`flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none ${
                selectedUser?.id === user.id
                  ? "border-blue-700 bg-blue-50 ring-2 ring-blue-200"
                  : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
              }`}
            >
              <span
                className="flex size-14 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: user.color_avatar }}
              >
                {user.iniciales}
              </span>
              <span className="font-semibold text-slate-900">
                {user.nombre}
              </span>
            </button>
          ))}
        </div>

        {users.length === 0 && !initialErrorMessage ? (
          <p className="mt-8 text-center text-slate-600">
            Aún no hay personas configuradas.
          </p>
        ) : null}

        {selectedUser ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600">PIN de 6 dígitos para</p>
                <p className="font-semibold text-slate-950">
                  {selectedUser.nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-blue-800 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
              >
                Cambiar persona
              </button>
            </div>

            <div className="mt-4">
              <label
                htmlFor="pin"
                className="mb-2 block text-sm font-medium text-slate-900"
              >
                PIN
              </label>
              <div className="relative">
                <input
                  ref={pinInputRef}
                  id="pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="current-password"
                  maxLength={6}
                  value={pin}
                  onChange={(event) => handlePinChange(event.target.value)}
                  disabled={isOffline || isSubmitting || isLocked}
                  aria-describedby={errorMessage ? "login-error" : undefined}
                  className="min-h-12 w-full rounded-lg border border-slate-300 px-4 pr-12 text-center text-2xl tracking-[0.5em] text-slate-950 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-700 disabled:bg-slate-100"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((visible) => !visible)}
                  disabled={isOffline || isSubmitting || isLocked}
                  aria-label={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-600 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none"
                >
                  {showPin ? (
                    <EyeOff aria-hidden="true" size={20} />
                  ) : (
                    <Eye aria-hidden="true" size={20} />
                  )}
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Se enviará automáticamente al completar los 6 dígitos.
              </p>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p
            id="login-error"
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {errorMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
