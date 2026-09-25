import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiRequest, qs } from "@/lib/api/request";
import type { PaginatedResponse } from "@/lib/types/api";

// Hooks for the clinic features added for PHP parity. Shapes mirror the
// Go handlers' JSON; column names are the legacy `vaccination` columns.

export interface ProcedureRow {
  id: number;
  uuid: string;
  date: string;
  date2: string;
  tp: number;
  tpname: string;
  vac: string; vacn: string; ser: string; deh: string;
  vac1: string; vac2: string; vac3: string; vac4: string; vac5: string; vac6: string; vac7: string; vac8: string; vac9: string;
  test1: string; test2: string; test3: string; test4: string; test5: string; test6: string; test7: string; test8: string;
  address: string; sax: string;
  sk: string;
  phone: string; // "1" = paid
  company: string; // payment method label
  price: string;
  vetname: string;
  anam: string; diagn: string; nout: string; koment: string; coment: string; dani: string;
  name: string; // edit log
}

export interface StaffMember { id: number; first_name: string; last_name: string; email: string; phone: string; status: string }
export interface PriceItem { id: number; name: string; price: string }
export interface Sale { id: number; name: string; price: string; date: string; method: string; comment: string }
export interface SalesTotals { card: string; cash: string; total: string }
export interface Appointment {
  id: number; uuid: string; date: string; booked_on: string; time: string; vetname: string;
  pname: string; owner: string; ownern: string; tpname: string; price: string; koment: string;
}
export interface Slot { time: string; available: boolean }
export interface Allergy { id: number; uuid: string; name: string; comment: string; date: string; mine: boolean }
export interface ProcedureFile { id: number; fileName: string; contentType: string; sizeBytes: number; createdAt: string }
export interface Member {
  id: number; group_id: number; first_name: string; personal_id: string; email: string; phone: string;
  zip: string; company_name: string; status: string; created?: string; last_login?: string; pet_count: number;
}
export interface Transaction { id: number; pet_id: number; pet_name: string; price: string; currency: string; status: string; provider: string; order_id: string; created_at?: string }
export interface Certificate {
  pet: { id: number; name: string; pet: string; sex: string; variety: string; color: string; date: string; chip: string; chipd: string; cast: string; castdate: string };
  owner: { name: string; personal_id: string; phone: string; address: string };
  rabies: CertTreatment | null;
  complex: CertTreatment | null;
  dehelminization: CertTreatment | null;
  ectoparasite: CertTreatment | null;
}
/** A certificate treatment line: only the fields the certificate prints. */
export interface CertTreatment {
  date: string; date2: string; vac: string; vacn: string; ser: string; deh: string;
  vac1: string; vac2: string; vac3: string; vac4: string; vac5: string; vac6: string; vac7: string;
}
export interface SmsPreview { date: string; kinds: Record<string, number>; sent_today: Record<string, number>; texts: Record<string, string> }

const GET = <T,>(path: string) => apiRequest<T>("GET", path);

/* ─── Pet records ─── */

/** One page of this clinic's records for the pet, newest first. */
export function usePetProcedures(petId: string | null, page = 1) {
  return useQuery<PaginatedResponse<ProcedureRow>>({
    queryKey: ["pet-procedures", petId, "page", page],
    queryFn: () => GET(`/procedures${qs({ pet_id: petId, page, pageSize: 50 })}`),
    enabled: !!petId,
    placeholderData: keepPreviousData,
  });
}

export function useUnpaidProcedures(petId: string | null) {
  return useQuery<PaginatedResponse<ProcedureRow>>({
    queryKey: ["pet-procedures", petId, "unpaid"],
    queryFn: () => GET(`/procedures${qs({ pet_id: petId, unpaid: 1, pageSize: 200 })}`),
    enabled: !!petId,
  });
}

/** Invalidate everything that shows a pet's records or the clinic's takings. */
export function useInvalidatePet() {
  const qc = useQueryClient();
  return (petId: string) => {
    qc.invalidateQueries({ queryKey: ["pet-procedures", petId] });
    qc.invalidateQueries({ queryKey: ["clinic-pet", petId] });
    qc.invalidateQueries({ queryKey: ["clinic-daily-stats"] });
  };
}

export function useCertificate(petId: string | null, ownerProof?: string) {
  return useQuery<Certificate>({
    queryKey: ["certificate", petId],
    queryFn: () => GET(`/pets/${petId}/certificate${qs({ owner_id: ownerProof })}`),
    enabled: !!petId,
  });
}

export function useAllergies(petId: string | null, ownerProof?: string) {
  return useQuery<Allergy[]>({
    queryKey: ["allergies", petId],
    queryFn: () => GET(`/allergies${qs({ pet_id: petId, owner_id: ownerProof })}`),
    enabled: !!petId,
  });
}

export function useProcedureFiles(petId: string, procId: number | null) {
  return useQuery<ProcedureFile[]>({
    queryKey: ["procedure-files", petId, procId],
    queryFn: () => GET(`/pets/${petId}/procedures/${procId}/files`),
    enabled: !!procId,
  });
}

/* ─── Clinic lists ─── */

export function useStaff() {
  return useQuery<StaffMember[]>({ queryKey: ["clinic-staff"], queryFn: () => GET("/staff") });
}

export function usePrices() {
  return useQuery<PriceItem[]>({ queryKey: ["clinic-prices"], queryFn: () => GET("/prices") });
}

export function useSales(from: string, to: string, page: number) {
  return useQuery<PaginatedResponse<Sale> & { totals: SalesTotals }>({
    queryKey: ["shop", from, to, page],
    queryFn: () => GET(`/shop${qs({ date_from: from, date_to: to, page, pageSize: 50 })}`),
    placeholderData: keepPreviousData,
  });
}

export function useAppointments(from: string, to: string, petId?: string) {
  return useQuery<PaginatedResponse<Appointment>>({
    queryKey: ["appointments", from, to, petId ?? ""],
    queryFn: () => GET(`/appointments${qs({ date_from: from, date_to: to, pet_id: petId, pageSize: 200 })}`),
    placeholderData: keepPreviousData,
  });
}

/** Free and taken times for one vet and day. Always re-read when shown: a
 * cached list offered a slot that had just been booked. */
export function useSlots(date: string, vetId: string) {
  return useQuery<Slot[]>({
    queryKey: ["slots", date, vetId],
    queryFn: () => GET(`/appointments/slots${qs({ date, vet_id: vetId })}`),
    enabled: !!date,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function usePromo(page: number, search: string) {
  return useQuery<PaginatedResponse<Member>>({
    queryKey: ["promo", page, search],
    queryFn: () => GET(`/promo${qs({ page, search, pageSize: 50 })}`),
    placeholderData: keepPreviousData,
  });
}

/* ─── Admin ─── */

export function useMembers(group: number, page: number, search: string) {
  return useQuery<PaginatedResponse<Member>>({
    queryKey: ["admin-members", group, page, search],
    queryFn: () => GET(`/admin/members${qs({ group, page, search, pageSize: 50 })}`),
    placeholderData: keepPreviousData,
  });
}

export function useTransactions(page: number) {
  return useQuery<PaginatedResponse<Transaction>>({
    queryKey: ["admin-transactions", page],
    queryFn: () => GET(`/admin/transactions${qs({ page, pageSize: 50 })}`),
    placeholderData: keepPreviousData,
  });
}

export function useSmsPreview() {
  return useQuery<SmsPreview>({ queryKey: ["sms-preview"], queryFn: () => GET("/notifications/sms/reminders") });
}

/* ─── Generic mutation ─── */

/** A mutation that calls the API and then invalidates the given query keys. */
export function useApiMutation<TBody = unknown, TRes = unknown>(
  method: "POST" | "PUT" | "DELETE",
  path: (body: TBody) => string,
  invalidate: unknown[][],
  bodyOf: (body: TBody) => unknown = (b) => b,
) {
  const qc = useQueryClient();
  return useMutation<TRes, Error, TBody>({
    mutationFn: (body) => apiRequest<TRes>(method, path(body), method === "DELETE" ? undefined : bodyOf(body)),
    onSuccess: () => invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key })),
  });
}
