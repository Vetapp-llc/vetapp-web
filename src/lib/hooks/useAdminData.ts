import { useQuery } from "@tanstack/react-query";
import { getStoredSession } from "@/lib/utils/session";
import { apiRequest, qs } from "@/lib/api/request";
import type { AdminStats, ClinicStats } from "@/lib/types/api";

function getToken(): string {
  return getStoredSession()?.accessToken ?? "";
}

const fetchJson = <T,>(path: string) => apiRequest<T>("GET", path);

export function useAdminStats() {
  const token = getToken();
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () =>
      fetchJson(`/stats/admin`),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useClinicStatsForAdmin(clinicCode: string | null) {
  const token = getToken();
  return useQuery<ClinicStats>({
    queryKey: ["admin-clinic-stats", clinicCode],
    queryFn: () =>
      fetchJson(`/stats/clinic${qs({ clinic: clinicCode })}`),
    enabled: !!token && !!clinicCode,
    staleTime: 5 * 60 * 1000,
  });
}
