export const ATTEMPTS_STORAGE_KEY = "palcos-login-attempts";

export type LoginAttemptState = {
  failedAttempts: number;
  lockedUntil: number | null;
};

export function readAttemptState(): LoginAttemptState {
  if (typeof window === "undefined") {
    return { failedAttempts: 0, lockedUntil: null };
  }

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

export function saveAttemptState(state: LoginAttemptState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(state));
}

export function clearLoginAttemptState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ATTEMPTS_STORAGE_KEY);
  window.dispatchEvent(new Event("palcos-login-state-cleared"));
}
