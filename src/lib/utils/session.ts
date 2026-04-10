import type { StoredSession, ClinicInfo } from "@/lib/types/api";

const SESSION_KEY = "vetapp-session";

export function getStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function getClinicZip(): string {
  const session = getStoredSession();
  return session?.clinic?.zip ?? "";
}

export function getClinicInfo(): ClinicInfo | null {
  const session = getStoredSession();
  return session?.clinic ?? null;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}
