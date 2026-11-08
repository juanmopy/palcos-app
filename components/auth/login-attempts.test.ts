import { afterEach, describe, expect, it } from "vitest";

import {
  ATTEMPTS_STORAGE_KEY,
  clearLoginAttemptState,
  readAttemptState,
} from "@/components/auth/login-attempts";

describe("login attempt state", () => {
  afterEach(() => {
    delete (globalThis as { window?: Window }).window;
  });

  it("clears the lockout state after signing out", () => {
    const storage = new Map<string, string>();

    (globalThis as { window: Window }).window = {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    } as unknown as Window;

    globalThis.window.localStorage.setItem(
      ATTEMPTS_STORAGE_KEY,
      JSON.stringify({ failedAttempts: 5, lockedUntil: Date.now() + 300000 }),
    );

    expect(readAttemptState().failedAttempts).toBe(5);

    clearLoginAttemptState();

    expect(readAttemptState()).toEqual({ failedAttempts: 0, lockedUntil: null });
    expect(globalThis.window.localStorage.getItem(ATTEMPTS_STORAGE_KEY)).toBeNull();
  });
});
