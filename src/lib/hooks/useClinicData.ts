import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getStoredSession } from "@/lib/utils/session";
import type {
  PaginatedResponse,
  PetListItem,
  Pet,
  Owner,
  OwnerWithPets,
  ClinicStats,
  DailyClinicStats,
  MonthlyClinicStats,
  YearlyClinicStats,
} from "@/lib/types/api";

function getToken(): string {
  return getStoredSession()?.accessToken ?? "";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function usePets(page: number, pageSize: number, search: string) {
  const token = getToken();
  return useQuery<PaginatedResponse<PetListItem>>({
    queryKey: ["clinic-pets", page, pageSize, search],
    queryFn: () =>
      fetchJson(
        `/api/clinic/pets?token=${encodeURIComponent(token)}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
      ),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function usePetDetail(petId: string | null) {
  const token = getToken();
  return useQuery<Pet>({
    queryKey: ["clinic-pet", petId],
    queryFn: () =>
      fetchJson(`/api/clinic/pets/${petId}?token=${encodeURIComponent(token)}`),
    enabled: !!token && !!petId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useOwners(page: number, pageSize: number, search: string) {
  const token = getToken();
  return useQuery<PaginatedResponse<Owner>>({
    queryKey: ["clinic-owners", page, pageSize, search],
    queryFn: () =>
      fetchJson(
        `/api/clinic/owners?token=${encodeURIComponent(token)}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
      ),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useOwnerDetail(personalId: string | null) {
  const token = getToken();
  return useQuery<OwnerWithPets>({
    queryKey: ["clinic-owner", personalId],
    queryFn: () =>
      fetchJson(
        `/api/clinic/owners/${encodeURIComponent(personalId!)}?token=${encodeURIComponent(token)}`,
      ),
    enabled: !!token && !!personalId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useClinicStats() {
  const token = getToken();
  return useQuery<ClinicStats>({
    queryKey: ["clinic-stats"],
    queryFn: () =>
      fetchJson(`/api/clinic/stats?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
  });
}

export function useDailyClinicStats(date: string, clinic?: string) {
  const token = getToken();
  const params = new URLSearchParams({
    token: token,
    date,
  });
  if (clinic) params.set("clinic", clinic);

  return useQuery<DailyClinicStats>({
    queryKey: ["clinic-daily-stats", date, clinic],
    queryFn: () =>
      fetchJson(`/api/clinic/stats/daily?${params}`),
    enabled: !!token && !!date,
    staleTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useMonthlyClinicStats(month: string, clinic?: string) {
  const token = getToken();
  const params = new URLSearchParams({
    token: token,
    month,
  });
  if (clinic) params.set("clinic", clinic);

  return useQuery<MonthlyClinicStats>({
    queryKey: ["clinic-monthly-stats", month, clinic],
    queryFn: () =>
      fetchJson(`/api/clinic/stats/monthly?${params}`),
    enabled: !!token && !!month,
    staleTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useYearlyClinicStats(year: string, clinic?: string) {
  const token = getToken();
  const params = new URLSearchParams({
    token: token,
    year,
  });
  if (clinic) params.set("clinic", clinic);

  return useQuery<YearlyClinicStats>({
    queryKey: ["clinic-yearly-stats", year, clinic],
    queryFn: () =>
      fetchJson(`/api/clinic/stats/yearly?${params}`),
    enabled: !!token && !!year,
    staleTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
