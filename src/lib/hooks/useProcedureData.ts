import { useQuery, useMutation } from "@tanstack/react-query";
import { getStoredSession } from "@/lib/utils/session";
import type {
  ProcedureTypeItem,
  VaccineOptionsResponse,
  SelectOption,
  PriceResponse,
  CreateProcedureRequest,
  RecordPaymentRequest,
  PaymentResponse,
} from "@/lib/types/api";

/** Extended ecto options with sprays (not yet in generated types) */
interface EctoOpts {
  drops: SelectOption[];
  collars: SelectOption[];
  tablets: SelectOption[];
  sprays: SelectOption[];
}

function getToken(): string {
  return getStoredSession()?.accessToken ?? "";
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useProcedureTypes() {
  const token = getToken();
  return useQuery<ProcedureTypeItem[]>({
    queryKey: ["procedure-types"],
    queryFn: () =>
      fetchJson(`/api/clinic/procedures/types?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useVaccineOptions() {
  const token = getToken();
  return useQuery<VaccineOptionsResponse>({
    queryKey: ["vaccine-options"],
    queryFn: () =>
      fetchJson(`/api/clinic/procedures/vaccine-options?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useTestOptions() {
  const token = getToken();
  return useQuery<SelectOption[]>({
    queryKey: ["test-options"],
    queryFn: () =>
      fetchJson(`/api/clinic/procedures/test-options?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useDehelOptions() {
  const token = getToken();
  return useQuery<SelectOption[]>({
    queryKey: ["dehel-options"],
    queryFn: () =>
      fetchJson(`/api/clinic/procedures/dehel-options?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useEctoOptions() {
  const token = getToken();
  return useQuery<EctoOpts>({
    queryKey: ["ecto-options"],
    queryFn: () =>
      fetchJson(`/api/clinic/procedures/ecto-options?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
}

export function useClinicStaff() {
  const token = getToken();
  return useQuery<StaffMember[]>({
    queryKey: ["clinic-staff"],
    queryFn: () =>
      fetchJson(`/api/clinic/staff?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useClinicPrices() {
  const token = getToken();
  return useQuery<PriceResponse[]>({
    queryKey: ["clinic-prices"],
    queryFn: () =>
      fetchJson(`/api/clinic/prices?token=${encodeURIComponent(token)}`),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProcedure() {
  const token = getToken();
  return useMutation<{ id: number }, Error, CreateProcedureRequest>({
    mutationFn: (body) =>
      postJson(`/api/clinic/procedures?token=${encodeURIComponent(token)}`, body),
  });
}

export function useRecordPayment() {
  const token = getToken();
  return useMutation<PaymentResponse, Error, RecordPaymentRequest>({
    mutationFn: (body) =>
      postJson(`/api/clinic/payments?token=${encodeURIComponent(token)}`, body),
  });
}
