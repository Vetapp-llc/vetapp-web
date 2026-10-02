"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProcedureForms,
  useClinicPrices,
  useClinicStaff,
  type FormField,
  type ProcedureForm,
} from "@/lib/hooks/useProcedureData";
import { getStoredSession } from "@/lib/utils/session";
import { apiRequest, todayGeorgia } from "@/lib/api/request";
import { localizeProcedureType, speciesEmoji, speciesKey } from "@/lib/utils/localize";
import { useBackClose } from "@/lib/hooks/useBackClose";
import type { PriceResponse } from "@/lib/types/api";
import { ProcedureFieldInputs, missingFields as missingFor, withDependents } from "./ProcedureFieldInputs";

/* ─── Types ─── */

interface ProcedureEntry {
  clientId: string;
  tp: number;
  tpname: string;
  price: string;
  /** Form values keyed by vaccination column (see backend procedure_forms.go). */
  values: Record<string, string>;
  /** Set once the procedure is saved, so a retry never saves it twice. */
  serverId?: number;
  error?: string;
}

interface VisitData {
  /** Stable per visit; the payment's idempotency key, kept in the draft. */
  visitKey: string;
  petId: string;
  petName: string;
  ownerPersonalId: string;
  ownerName: string;
  ownerPhone: string;
  date: string;
  anam: string;
  diagn: string;
  koment: string;
  vetId: string;
  procedures: ProcedureEntry[];
}

type Step = "build" | "pay" | "receipt";

interface ReceiptData {
  petName: string;
  ownerName: string;
  date: string;
  clinicName: string;
  procedures: { name: string; price: number }[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
  method: "cash" | "card";
}

/* ─── Helpers ─── */

function genId(): string {
  return crypto.randomUUID();
}

function matchPrice(typeName: string, priceList: PriceResponse[]): string {
  const lower = typeName.toLowerCase();
  const parenMatch = typeName.match(/^(.+?)\s*\((.+?)\)\s*$/);
  const geoName = parenMatch ? parenMatch[1].trim().toLowerCase() : lower;
  const engName = parenMatch ? parenMatch[2].trim().toLowerCase() : "";
  for (const p of priceList) {
    const pLower = p.name.toLowerCase();
    // Only whole-number prices can prefill: the list also holds ranges ("15/125").
    if (!/^\d+(\.\d{1,2})?$/.test(p.price.trim())) continue;
    if (pLower === lower || pLower === geoName) return p.price.trim();
    if (engName && pLower === engName) return p.price.trim();
    if (pLower.includes(geoName) || geoName.includes(pLower)) return p.price.trim();
    if (engName && (pLower.includes(engName) || engName.includes(pLower))) return p.price.trim();
  }
  return "";
}

function parsePrice(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Amount as the backend accepts it: a number with at most two decimals. */
function money(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

const PRICE_RE = /^\d{1,9}(\.\d{1,2})?$/;

/** Fields the vet must still fill before the visit can be paid. */
function missingFields(proc: ProcedureEntry, form: ProcedureForm | undefined): FormField[] {
  return missingFor(proc.values, form);
}

function buildProcBody(proc: ProcedureEntry, visit: VisitData): Record<string, unknown> {
  const body: Record<string, unknown> = {
    uuid: visit.petId,
    // Proof of the owner lookup: lets a clinic treat a pet registered elsewhere.
    owner: visit.ownerPersonalId || undefined,
    tp: proc.tp,
    tpname: proc.tpname,
    date: visit.date,
    price: proc.price.trim() || "0",
    vetname: visit.vetId || undefined,
  };
  for (const [col, val] of Object.entries(proc.values)) {
    if (col !== "price" && val.trim()) body[col] = val.trim();
  }
  // Visit-level notes apply to every procedure unless its own form set them.
  if (!body.anam && visit.anam.trim()) body.anam = visit.anam.trim();
  if (!body.diagn && visit.diagn.trim()) body.diagn = visit.diagn.trim();
  if (!body.koment && visit.koment.trim()) body.koment = visit.koment.trim();
  return body;
}

// v2: procedure entries changed shape; v1 drafts are not restorable.
// The draft is kept through payment too, with each saved procedure's id,
// so a reload after a partial save never saves (or bills) an item twice.
const DRAFT_TTL = 24 * 60 * 60 * 1000;
const draftKey = (petId: string) => `vetapp-visit-draft-v2-${petId}`;

function saveDraft(data: VisitData) {
  try {
    localStorage.setItem(draftKey(data.petId), JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch { /* storage full or disabled */ }
}

function loadDraft(petId: string): VisitData | null {
  try {
    const raw = localStorage.getItem(draftKey(petId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > DRAFT_TTL) {
      localStorage.removeItem(draftKey(petId));
      return null;
    }
    return parsed as VisitData;
  } catch {
    return null;
  }
}

function clearDraft(petId: string) {
  try {
    localStorage.removeItem(draftKey(petId));
  } catch { /* ignore */ }
}

/* ─── Main component ─── */

interface VisitBuilderProps {
  petId: string;
  petName: string;
  species: string;
  ownerPersonalId: string;
  ownerName: string;
  ownerPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function VisitBuilder({
  petId, petName, species, ownerPersonalId, ownerName, ownerPhone, onClose, onSuccess,
}: VisitBuilderProps) {
  const t = useTranslations("visit");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const { data: forms, isLoading: formsLoading } = useProcedureForms(speciesKey(species));
  const { data: prices, isLoading: pricesLoading } = useClinicPrices();
  const { data: staffList } = useClinicStaff();

  const formByTp = useMemo(() => {
    const m = new Map<number, ProcedureForm>();
    for (const f of forms ?? []) m.set(f.tp, f);
    return m;
  }, [forms]);

  const [visitData, setVisitData] = useState<VisitData>({
    visitKey: genId(),
    petId, petName, ownerPersonalId, ownerName, ownerPhone,
    date: todayGeorgia(), anam: "", diagn: "", koment: "", vetId: "",
    procedures: [],
  });

  const [step, setStep] = useState<Step>("build");
  // Back closes the builder; on the payment step it first returns to the
  // procedure list, like the step's own "back" link.
  useBackClose(true, onClose);
  useBackClose(step === "pay", () => setStep("build"));
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [undoItem, setUndoItem] = useState<{ proc: ProcedureEntry; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [draftAvailable, setDraftAvailable] = useState(false);

  const anySaved = visitData.procedures.some((p) => p.serverId);

  useEffect(() => {
    const draft = loadDraft(petId);
    if (draft && draft.procedures.length > 0) setDraftAvailable(true);
  }, [petId]);

  // Back-fill prices once the price list arrives.
  useEffect(() => {
    if (!prices || prices.length === 0) return;
    setVisitData((prev) => {
      let changed = false;
      const procedures = prev.procedures.map((proc) => {
        if (proc.price || proc.serverId) return proc;
        const matched = matchPrice(proc.tpname, prices);
        if (!matched) return proc;
        changed = true;
        return { ...proc, price: matched };
      });
      return changed ? { ...prev, procedures } : prev;
    });
  }, [prices]);

  // Autosave the draft until the visit is paid (see saveDraft).
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    // Never overwrite a saved draft the vet has not answered yet, and never
    // save an empty visit — opening the form would otherwise replace a
    // half-paid draft (and its saved ids) with nothing after a second.
    if (step === "receipt" || draftAvailable || visitData.procedures.length === 0) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(visitData), 1000);
    return () => clearTimeout(saveTimerRef.current);
  }, [visitData, step, draftAvailable]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const restoreDraft = useCallback(() => {
    const draft = loadDraft(petId);
    if (draft) {
      setVisitData({ ...draft, visitKey: draft.visitKey || genId() });
      if (draft.procedures.length > 0) setExpandedCardId(draft.procedures[0].clientId);
      // Items already saved can only be paid for now, not edited.
      if (draft.procedures.some((p) => p.serverId)) setStep("pay");
    }
    setDraftAvailable(false);
  }, [petId]);

  const discardDraft = useCallback(() => {
    clearDraft(petId);
    setDraftAvailable(false);
  }, [petId]);

  const addProcedure = useCallback((form: ProcedureForm) => {
    const proc: ProcedureEntry = {
      clientId: genId(), tp: form.tp, tpname: form.name,
      price: matchPrice(form.name, prices ?? []), values: {},
    };
    setVisitData((prev) => ({ ...prev, procedures: [...prev.procedures, proc] }));
    setExpandedCardId(proc.clientId);
    setSearchQuery("");
    setSearchOpen(false);
  }, [prices]);

  const updateProcedure = useCallback((clientId: string, patch: Partial<ProcedureEntry>) => {
    setVisitData((prev) => ({
      ...prev,
      procedures: prev.procedures.map((p) => (p.clientId === clientId ? { ...p, ...patch } : p)),
    }));
  }, []);

  const setValue = useCallback((clientId: string, column: string, value: string) => {
    setVisitData((prev) => ({
      ...prev,
      procedures: prev.procedures.map((p) =>
        p.clientId === clientId
          ? { ...p, values: withDependents(formByTp.get(p.tp), { ...p.values, [column]: value }, column) }
          : p,
      ),
    }));
  }, [formByTp]);

  const removeProcedure = useCallback((clientId: string) => {
    const proc = visitData.procedures.find((p) => p.clientId === clientId);
    if (!proc || proc.serverId) return;
    if (undoItem) clearTimeout(undoItem.timer);
    setVisitData((prev) => ({ ...prev, procedures: prev.procedures.filter((p) => p.clientId !== clientId) }));
    const timer = setTimeout(() => setUndoItem(null), 5000);
    setUndoItem({ proc, timer });
  }, [visitData.procedures, undoItem]);

  const undoRemove = useCallback(() => {
    if (!undoItem) return;
    clearTimeout(undoItem.timer);
    setVisitData((prev) => ({ ...prev, procedures: [...prev.procedures, undoItem.proc] }));
    setUndoItem(null);
  }, [undoItem]);

  const subtotal = useMemo(
    () => round2(visitData.procedures.reduce((sum, p) => sum + parsePrice(p.price), 0)),
    [visitData.procedures],
  );
  const discountAmount = round2((subtotal * discountPercent) / 100);
  const total = round2(Math.max(0, subtotal - discountAmount));

  const availableForms = useMemo(() => {
    const seen = new Set<number>();
    return (forms ?? []).filter((f) => (seen.has(f.tp) ? false : (seen.add(f.tp), true)));
  }, [forms]);

  const filteredForms = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return availableForms.filter(
      (f) => f.name.toLowerCase().includes(q) || localizeProcedureType(f.name, locale).toLowerCase().includes(q),
    );
  }, [availableForms, searchQuery, locale]);

  const invalid = useMemo(
    () => visitData.procedures.some(
      (p) => missingFields(p, formByTp.get(p.tp)).length > 0 || (p.price.trim() !== "" && !PRICE_RE.test(p.price.trim())),
    ),
    [visitData.procedures, formByTp],
  );
  const canProceedToPayment = visitData.procedures.length > 0 && !invalid && !!visitData.date;

  /* ─── Submission ─── */

  // Saves every procedure not yet saved, then records one payment for all
  // of them with the method and total currently on screen. Running it
  // again after a failure only retries what failed, so nothing is saved
  // or charged twice.
  const submitVisit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setPaymentError(null);

    const ids: number[] = [];
    let failed = 0;
    for (const proc of visitData.procedures) {
      if (proc.serverId) {
        ids.push(proc.serverId);
        continue;
      }
      try {
        // The client id is the idempotency key: if a save committed but its
        // response was lost, the retry gets the same record back.
        const created = await apiRequest<{ id: number }>("POST", "/procedures", buildProcBody(proc, visitData), {
          "Idempotency-Key": `proc-${proc.clientId}`,
        });
        ids.push(created.id);
        updateProcedure(proc.clientId, { serverId: created.id, error: undefined });
      } catch (err) {
        failed++;
        updateProcedure(proc.clientId, { error: err instanceof Error ? err.message : "error" });
      }
    }

    if (failed === 0) {
      try {
        await apiRequest(
          "POST",
          "/payments/record",
          { uuid: petId, date: visitData.date, method: paymentMethod, amount: money(total), procedure_ids: ids },
          // Same visit, same payment → same key (a lost response is replayed);
          // a changed method or amount is a different payment, not a replay.
          { "Idempotency-Key": `pay-${visitData.visitKey}-${paymentMethod}-${money(total)}` },
        );
        setReceiptData({
          petName,
          ownerName,
          date: visitData.date,
          clinicName: getStoredSession()?.clinic?.companyName ?? "",
          procedures: visitData.procedures.map((p) => ({
            name: localizeProcedureType(p.tpname, locale) + (p.values.vac ? ` — ${p.values.vac}` : ""),
            price: parsePrice(p.price),
          })),
          subtotal,
          discountPercent,
          discountAmount,
          total,
          method: paymentMethod,
        });
        clearDraft(petId);
        queryClient.invalidateQueries({ queryKey: ["clinic-pet", petId] });
        queryClient.invalidateQueries({ queryKey: ["pet-procedures", petId] });
        setStep("receipt");
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : "Payment failed");
      }
    }
    setSubmitting(false);
  };

  const handleDone = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["clinic-pet", petId] });
    onSuccess();
    onClose();
  }, [queryClient, petId, onSuccess, onClose]);

  const savedCount = visitData.procedures.filter((p) => p.serverId).length;
  const errorCount = visitData.procedures.filter((p) => p.error && !p.serverId).length;
  const input = "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const label = "text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50";

  /* ─── Render ─── */

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-dark/30 backdrop-blur-sm animate-fade-in" onClick={step === "build" && !anySaved ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.12)] animate-modal-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">{speciesEmoji(species)}</div>
            <div>
              <h2 className="text-lg font-bold text-primary-dark">{petName}</h2>
              <p className="text-xs text-foreground-muted/60">{ownerName}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label={t("close")} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-foreground-muted hover:bg-gray-200 transition-colors cursor-pointer">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {draftAvailable && step === "build" && (
            <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <span className="text-sm text-amber-800">{t("draftRestore")}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={restoreDraft} className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 cursor-pointer">{t("restore")}</button>
                <button onClick={discardDraft} className="rounded-lg bg-white border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 cursor-pointer">{t("discard")}</button>
              </div>
            </div>
          )}

          {submitting && (
            <div className="mx-6 mt-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-sm text-blue-800">{t("saving")} ({savedCount}/{visitData.procedures.length})</p>
              <div className="mt-2 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(savedCount / Math.max(1, visitData.procedures.length)) * 100}%` }} />
              </div>
            </div>
          )}

          {!submitting && step === "pay" && (errorCount > 0 || paymentError) && (
            <div className="mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-800">
                {errorCount > 0
                  ? t("partialError", { success: savedCount, total: visitData.procedures.length })
                  : `${t("paymentFailed")}: ${paymentError}`}
              </p>
              {visitData.procedures.filter((p) => p.error && !p.serverId).map((p) => (
                <p key={p.clientId} className="mt-1 text-xs text-red-700">{localizeProcedureType(p.tpname, locale)}: {p.error}</p>
              ))}
              <button onClick={submitVisit} className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 cursor-pointer">
                {t("retry")}
              </button>
            </div>
          )}

          {/* Step 1: Build */}
          {step === "build" && (
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>{t("date")}</label>
                  <input type="date" value={visitData.date} max={todayGeorgia()} onChange={(e) => setVisitData((p) => ({ ...p, date: e.target.value }))} className={input} />
                </div>
                <div>
                  <label className={label}>{t("anamnesis")}</label>
                  <input type="text" value={visitData.anam} onChange={(e) => setVisitData((p) => ({ ...p, anam: e.target.value }))} placeholder={t("anamnesisPlaceholder")} className={input} />
                </div>
                <div>
                  <label className={label}>{t("diagnosis")}</label>
                  <input type="text" value={visitData.diagn} onChange={(e) => setVisitData((p) => ({ ...p, diagn: e.target.value }))} placeholder={t("diagnosisPlaceholder")} className={input} />
                </div>
                <div>
                  <label className={label}>{t("vetNotes")}</label>
                  <input type="text" value={visitData.koment} onChange={(e) => setVisitData((p) => ({ ...p, koment: e.target.value }))} placeholder={t("vetNotesPlaceholder")} className={input} />
                </div>
                {staffList && staffList.length > 0 && (
                  <div>
                    <label className={label}>{t("vet")}</label>
                    <select value={visitData.vetId} onChange={(e) => setVisitData((p) => ({ ...p, vetId: e.target.value }))} className={`${input} bg-white`}>
                      <option value="">{t("vetMe")}</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.first_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4" />

              <div ref={dropdownRef} className="relative">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/40" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredForms.length > 0) addProcedure(filteredForms[0]);
                      if (e.key === "Escape") setSearchOpen(false);
                    }}
                    placeholder={t("addProcedure")}
                    className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {availableForms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {availableForms.map((f) => (
                      <button key={f.tp} onClick={() => addProcedure(f)} className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-foreground-muted hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer">
                        {localizeProcedureType(f.name, locale)}
                      </button>
                    ))}
                  </div>
                )}

                {searchOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    {formsLoading ? (
                      <div className="px-4 py-3 text-sm text-foreground-muted/50">{t("loading")}</div>
                    ) : filteredForms.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-foreground-muted/50">{t("noResults")}</div>
                    ) : (
                      filteredForms.map((f) => (
                        <button key={f.tp} onClick={() => addProcedure(f)} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer">
                          <span className="font-medium text-primary-dark">{localizeProcedureType(f.name, locale)}</span>
                          <span className="text-xs text-foreground-muted/40">{f.name !== localizeProcedureType(f.name, locale) ? f.name : ""}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {visitData.procedures.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                  <p className="text-sm text-foreground-muted/50">{t("noProceduresYet")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visitData.procedures.map((proc) => (
                    <ProcedureCard
                      key={proc.clientId}
                      proc={proc}
                      form={formByTp.get(proc.tp)}
                      expanded={expandedCardId === proc.clientId}
                      onToggle={() => setExpandedCardId(expandedCardId === proc.clientId ? null : proc.clientId)}
                      onPrice={(price) => updateProcedure(proc.clientId, { price })}
                      onValue={(col, v) => setValue(proc.clientId, col, v)}
                      onRemove={() => removeProcedure(proc.clientId)}
                      locale={locale}
                      t={t}
                      pricesLoading={pricesLoading}
                    />
                  ))}
                </div>
              )}

              {undoItem && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-white shadow-lg animate-fade-in">
                  <span className="text-sm">{t("procedureRemoved")}</span>
                  <button onClick={undoRemove} className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30 cursor-pointer">{t("undo")}</button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment */}
          {step === "pay" && (
            <div className="px-6 py-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary-dark uppercase tracking-wider">{t("payment")}</h3>
                {!anySaved && (
                  <button onClick={() => setStep("build")} className="flex items-center gap-1 text-xs text-foreground-muted hover:text-primary-dark cursor-pointer">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {t("back")}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {visitData.procedures.map((proc) => (
                  <div key={proc.clientId} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-primary-dark">
                      {proc.serverId ? "✓ " : ""}
                      {localizeProcedureType(proc.tpname, locale)}
                      {proc.values.vac ? <span className="text-foreground-muted/50 ml-1">— {proc.values.vac}</span> : null}
                    </span>
                    <span className="text-sm font-semibold text-primary-dark">{parsePrice(proc.price)} ₾</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm text-foreground-muted/60">{t("subtotal")}</span>
                <span className="text-sm font-semibold">{subtotal} ₾</span>
              </div>

              <div>
                <label className={label}>{t("discount")}</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0, 10, 15, 20, 50, 100].map((pct) => (
                    <button key={pct} onClick={() => setDiscountPercent(pct)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${discountPercent === pct ? "bg-primary text-white" : "bg-gray-100 text-foreground-muted hover:bg-gray-200"}`}>
                      {pct === 0 ? t("noDiscount") : `${pct}%`}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="0" max="100"
                      value={![0, 10, 15, 20, 50, 100].includes(discountPercent) ? discountPercent : ""}
                      onChange={(e) => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                      placeholder={t("customPercent")}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-foreground-muted/50">%</span>
                  </div>
                </div>
              </div>

              {discountPercent > 0 && (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-700 line-through">{subtotal} ₾</span>
                    <span className="text-green-700">-{discountAmount} ₾ ({discountPercent}%)</span>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-base font-bold text-primary-dark">{t("total")}</span>
                <span className="text-base font-bold text-primary-dark">{total} ₾</span>
              </div>

              <div className="flex gap-3">
                {(["cash", "card"] as const).map((m) => (
                  <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer ${paymentMethod === m ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-foreground-muted hover:border-gray-300"}`}>
                    {t(m)}
                  </button>
                ))}
              </div>

              <button onClick={submitVisit} disabled={submitting} className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {submitting ? t("processing") : `${t("pay")} ${total} ₾`}
              </button>
            </div>
          )}

          {step === "receipt" && receiptData && <Receipt data={receiptData} t={t} onDone={handleDone} />}
        </div>

        {step === "build" && visitData.procedures.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 bg-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-foreground-muted/50">{t("total")}</span>
                <span className="ml-2 text-lg font-bold text-primary-dark">{pricesLoading ? "..." : `${subtotal} ₾`}</span>
                {invalid && <p className="text-xs text-red-600">{t("requiredMissing")}</p>}
              </div>
              <button onClick={() => setStep("pay")} disabled={!canProceedToPayment} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {t("continueToPayment")} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ProcedureCard ─── */

type VisitT = ReturnType<typeof useTranslations<"visit">>;

interface ProcedureCardProps {
  proc: ProcedureEntry;
  form: ProcedureForm | undefined;
  expanded: boolean;
  onToggle: () => void;
  onPrice: (price: string) => void;
  onValue: (column: string, value: string) => void;
  onRemove: () => void;
  locale: string;
  t: VisitT;
  pricesLoading: boolean;
}

function ProcedureCard({ proc, form, expanded, onToggle, onPrice, onValue, onRemove, locale, t, pricesLoading }: ProcedureCardProps) {
  const missing = missingFields(proc, form);
  const badPrice = proc.price.trim() !== "" && !PRICE_RE.test(proc.price.trim());
  return (
    <div className={`rounded-xl border bg-white ${missing.length || badPrice ? "border-red-200" : "border-gray-100"}`}>
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} aria-expanded={expanded} className="flex flex-1 min-w-0 items-center gap-2 text-left cursor-pointer">
          <svg className={`h-4 w-4 shrink-0 text-foreground-muted/60 transition-transform ${expanded ? "rotate-90" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="min-w-0">
          <span className="text-sm font-semibold text-primary-dark">{localizeProcedureType(proc.tpname, locale)}</span>
          {proc.values.vac && <span className="ml-2 text-xs text-foreground-muted/60">{proc.values.vac}</span>}
          {missing.length > 0 && <span className="ml-2 text-xs text-red-600">{t("requiredMissing")}</span>}
          </span>
        </button>
        <div className="flex items-center gap-1">
          <input
            type="text" inputMode="decimal" value={proc.price}
            onChange={(e) => onPrice(e.target.value)}
            placeholder={pricesLoading ? "..." : t("price")}
            aria-label={t("price")}
            className={`w-20 rounded-lg border px-2 py-1.5 text-right text-sm ${badPrice ? "border-red-400" : "border-gray-200"}`}
          />
          <span className="text-sm text-foreground-muted">₾</span>
        </div>
        <button onClick={onRemove} aria-label={t("remove")} className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted/50 hover:bg-red-50 hover:text-red-600 cursor-pointer">×</button>
      </div>
      {expanded && (
        <div className="border-t border-gray-50 px-4 py-3">
          {!form ? <p className="text-xs text-foreground-muted/60">{t("loading")}</p> : <ProcedureFieldInputs form={form} values={proc.values} onChange={onValue} />}
        </div>
      )}
    </div>
  );
}

/* ─── Receipt ─── */

interface ReceiptProps {
  data: ReceiptData;
  t: VisitT;
  onDone: () => void;
}

function Receipt({ data, t, onDone }: ReceiptProps) {
  const handlePrint = () => window.print();

  return (
    <div className="px-6 py-4 space-y-4">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .receipt-content, .receipt-content * { visibility: visible; }
          .receipt-content { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="receipt-content">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-primary-dark">{data.clinicName}</h2>
          <p className="text-xs text-foreground-muted/50">{t("receipt")}</p>
        </div>

        <div className="space-y-1 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground-muted/60">{t("date")}:</span>
            <span className="font-medium">{data.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted/60">{t("patient")}:</span>
            <span className="font-medium">{data.petName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground-muted/60">{t("ownerLabel")}:</span>
            <span className="font-medium">{data.ownerName}</span>
          </div>
        </div>

        <div className="border-t border-b border-gray-200 py-3 space-y-2">
          {data.procedures.map((p, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{p.name}</span>
              <span className="font-medium">{p.price} ₾</span>
            </div>
          ))}
        </div>

        <div className="py-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-foreground-muted/60">{t("subtotal")}:</span>
            <span>{data.subtotal} ₾</span>
          </div>
          {data.discountPercent > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t("discount")} ({data.discountPercent}%):</span>
              <span>-{data.discountAmount} ₾</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
            <span>{t("total")}:</span>
            <span>{data.total} ₾</span>
          </div>
          <div className="flex justify-between text-xs text-foreground-muted/50">
            <span>{t("paymentMethod")}:</span>
            <span>{data.method === "cash" ? t("cash") : t("card")}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 no-print">
        <button
          onClick={handlePrint}
          className="flex-1 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-foreground-muted hover:bg-gray-50 transition-colors cursor-pointer"
        >
          {t("print")}
        </button>
        <button
          onClick={onDone}
          className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors cursor-pointer"
        >
          {t("done")}
        </button>
      </div>
    </div>
  );
}
