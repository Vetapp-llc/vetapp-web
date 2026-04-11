import { useQuery } from "@tanstack/react-query";
import { getStoredSession } from "@/lib/utils/session";
import type { AdminStats, ClinicStats } from "@/lib/types/api";

function getToken(): string {
  return getStoredSession()?.accessToken ?? "";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useAdminStats() {
  const token = getToken();
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () =>
      fetchJson(`/api/admin/stats?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClinicStatsForAdmin(clinicCode: string | null) {
  const token = getToken();
  return useQuery<ClinicStats>({
    queryKey: ["admin-clinic-stats", clinicCode],
    queryFn: () =>
      fetchJson(
        `/api/admin/stats/clinic?token=${encodeURIComponent(token)}&clinic=${encodeURIComponent(clinicCode!)}`,
      ),
    enabled: !!token && !!clinicCode,
    staleTime: 5 * 60 * 1000,
  });
}
