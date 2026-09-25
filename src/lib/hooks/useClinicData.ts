import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getStoredSession } from "@/lib/utils/session";
import { apiRequest, qs } from "@/lib/api/request";
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

const fetchJson = <T,>(path: string) => apiRequest<T>("GET", path);

export function usePets(page: number, pageSize: number, search: string) {
  const token = getToken();
  return useQuery<PaginatedResponse<PetListItem>>({
    queryKey: ["clinic-pets", page, pageSize, search],
    queryFn: () =>
      fetchJson(`/pets${qs({ page, pageSize, search })}`),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

/**
 * ownerProof: the owner's personal ID the pet was found by. It lets a
 * clinic open a pet registered elsewhere (see canAccessPet in the backend).
 */
export function usePetDetail(petId: string | null, ownerProof?: string) {
  const token = getToken();
  return useQuery<Pet>({
    queryKey: ["clinic-pet", petId],
    queryFn: () =>
      fetchJson(`/pets/${petId}${qs({ owner_id: ownerProof })}`),
    enabled: !!token && !!petId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useOwners(page: number, pageSize: number, search: string) {
  const token = getToken();
  return useQuery<PaginatedResponse<Owner>>({
    queryKey: ["clinic-owners", page, pageSize, search],
    queryFn: () =>
      fetchJson(`/owners${qs({ page, pageSize, search })}`),
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
      fetchJson(`/owners/${encodeURIComponent(personalId!)}`),
    enabled: !!token && !!personalId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useClinicStats() {
  const token = getToken();
  return useQuery<ClinicStats>({
    queryKey: ["clinic-stats"],
    queryFn: () =>
      fetchJson(`/stats/clinic`),
    enabled: !!token,
    staleTime: 15 * 60 * 1000,
  });
}

export function useDailyClinicStats(date: string, clinic?: string) {
  const token = getToken();

  return useQuery<DailyClinicStats>({
    queryKey: ["clinic-daily-stats", date, clinic],
    queryFn: () =>
      fetchJson(`/stats/clinic/daily${qs({ date, clinic })}`),
    enabled: !!token && !!date,
    staleTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useMonthlyClinicStats(month: string, clinic?: string) {
  const token = getToken();

  return useQuery<MonthlyClinicStats>({
    queryKey: ["clinic-monthly-stats", month, clinic],
    queryFn: () =>
      fetchJson(`/stats/clinic/monthly${qs({ month, clinic })}`),
    enabled: !!token && !!month,
    staleTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useYearlyClinicStats(year: string, clinic?: string) {
  const token = getToken();

  return useQuery<YearlyClinicStats>({
    queryKey: ["clinic-yearly-stats", year, clinic],
    queryFn: () =>
      fetchJson(`/stats/clinic/yearly${qs({ year, clinic })}`),
    enabled: !!token && !!year,
    staleTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
