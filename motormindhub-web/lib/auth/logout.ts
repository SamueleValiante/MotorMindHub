import { useAuthStore } from "./store";

/** Invalida il refresh token lato backend (via proxy) e pulisce lo stato locale. */
export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  useAuthStore.getState().clearSession();
}
