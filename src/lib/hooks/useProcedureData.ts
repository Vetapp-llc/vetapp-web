import { useQuery, useMutation } from "@tanstack/react-query";
import { getStoredSession } from "@/lib/utils/session";
import { apiRequest } from "@/lib/api/request";
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

const fetchJson = <T,>(path: string) => apiRequest<T>("GET", path);
const postJson = <T,>(path: string, body: unknown) => apiRequest<T>("POST", path, body);

export function useProcedureTypes() {
  const token = getToken();
  return useQuery<ProcedureTypeItem[]>({
    queryKey: ["procedure-types"],
    queryFn: () =>
      fetchJson(`/procedures/types`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useVaccineOptions() {
  const token = getToken();
  return useQuery<VaccineOptionsResponse>({
    queryKey: ["vaccine-options"],
    queryFn: () =>
      fetchJson(`/procedures/vaccine-options`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useTestOptions() {
  const token = getToken();
  return useQuery<SelectOption[]>({
    queryKey: ["test-options"],
    queryFn: () =>
      fetchJson(`/procedures/test-options`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useDehelOptions() {
  const token = getToken();
  return useQuery<SelectOption[]>({
    queryKey: ["dehel-options"],
    queryFn: () =>
      fetchJson(`/procedures/dehel-options`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useEctoOptions() {
  const token = getToken();
  return useQuery<EctoOpts>({
    queryKey: ["ecto-options"],
    queryFn: () =>
      fetchJson(`/procedures/ecto-options`),
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
      fetchJson(`/staff`),
    enabled: !!token,
    staleTime: Infinity,
  });
}

export function useClinicPrices() {
  const token = getToken();
  return useQuery<PriceResponse[]>({
    queryKey: ["clinic-prices"],
    queryFn: () =>
      fetchJson(`/prices`),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProcedure() {
  const token = getToken();
  return useMutation<{ id: number }, Error, CreateProcedureRequest>({
    mutationFn: (body) =>
      postJson(`/procedures`, body),
  });
}

export function useRecordPayment() {
  const token = getToken();
  return useMutation<PaymentResponse, Error, RecordPaymentRequest>({
    mutationFn: (body) =>
      postJson(`/payments/record`, body),
  });
}

/* ─── Species-aware procedure forms (GET /procedures/forms) ─── */

export interface FormField {
  column: string;
  label: string;
  kind: "text" | "textarea" | "select" | "result" | "date" | "money";
  group?: string;
  options?: string[];
  depends_on?: string;
  options_by?: Record<string, string[]>;
  required?: boolean;
}

export interface ProcedureForm {
  tp: number;
  name: string;
  species?: string;
  fields: FormField[];
}

/** The procedure forms for one species (dog | cat | other), as the PHP clinic portal had them. */
export function useProcedureForms(species: string) {
  return useQuery<ProcedureForm[]>({
    queryKey: ["procedure-forms", species],
    queryFn: () => fetchJson(`/procedures/forms?species=${encodeURIComponent(species)}`),
    enabled: !!getToken() && !!species,
    staleTime: Infinity,
  });
}
