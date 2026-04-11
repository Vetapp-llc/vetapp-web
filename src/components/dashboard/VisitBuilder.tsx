"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  useProcedureTypes,
  useVaccineOptions,
  useTestOptions,
  useDehelOptions,
  useEctoOptions,
  useClinicPrices,
  useClinicStaff,
} from "@/lib/hooks/useProcedureData";
import { getStoredSession } from "@/lib/utils/session";
import { localizeProcedureType } from "@/lib/utils/localize";
import { getFieldConfig, getDropdownOptions, getBrandOptions, TEST_PANELS, ECTO_CATEGORIES } from "@/lib/config/procedureFields";
import type { ProcedureTypeItem, SelectOption, CreateProcedureRequest, PriceResponse } from "@/lib/types/api";

/* ─── Types ─── */

interface ProcedureEntry {
  clientId: string;
  tp: number;
  tpname: string;
  vac: string;
  vacn: string;
  ser: string;
  deh: string;
  price: string;
  date2: string;
  nout: string;
  dani: string;
  coment: string;
  vac1: string; vac2: string; vac3: string; vac4: string; vac5: string;
  vac6: string; vac7: string; vac8: string; vac9: string;
}

interface VisitData {
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

interface SubmissionResult {
  clientId: string;
  status: "pending" | "success" | "error";
  serverId?: number;
  error?: string;
}

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

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function matchPrice(typeName: string, priceList: PriceResponse[]): string {
  const lower = typeName.toLowerCase();
  // Extract Georgian part (before parentheses) and English part (inside parentheses)
  const parenMatch = typeName.match(/^(.+?)\s*\((.+?)\)\s*$/);
  const geoName = parenMatch ? parenMatch[1].trim().toLowerCase() : lower;
  const engName = parenMatch ? parenMatch[2].trim().toLowerCase() : "";

  for (const p of priceList) {
    const pLower = p.name.toLowerCase();
    // Exact match
    if (pLower === lower) return p.price;
    // Match Georgian or English part
    if (pLower === geoName) return p.price;
    if (engName && pLower === engName) return p.price;
    // Substring match (either contains the other)
    if (pLower.includes(geoName) || geoName.includes(pLower)) return p.price;
    if (engName && (pLower.includes(engName) || engName.includes(pLower))) return p.price;
  }
  return "";
}

function makeProcedure(type: ProcedureTypeItem, priceList: PriceResponse[]): ProcedureEntry {
  return {
    clientId: genId(),
    tp: type.tp,
    tpname: type.name,
    vac: "", vacn: "", ser: "", deh: "", price: matchPrice(type.name, priceList),
    date2: "", nout: "", dani: "", coment: "",
    vac1: "", vac2: "", vac3: "", vac4: "", vac5: "",
    vac6: "", vac7: "", vac8: "", vac9: "",
  };
}

function parsePrice(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function buildProcBody(
  proc: ProcedureEntry,
  visitData: VisitData,
  petId: string,
  ownerPersonalId: string,
  ownerName: string,
  petName: string,
  visitId: string,
): Record<string, unknown> {
  return {
    uuid: petId,
    tp: proc.tp,
    tpname: proc.tpname,
    date: visitData.date,
    anam: visitData.anam,
    diagn: visitData.diagn,
    koment: `[visit:${visitId}] ${visitData.koment}`,
    owner: ownerPersonalId,
    ownern: ownerName,
    phone: "0",
    vetname: visitData.vetId || undefined,
    pname: petName,
    price: proc.price || "0",
    vac: proc.vac || undefined,
    vacn: proc.vacn || undefined,
    ser: proc.ser || undefined,
    deh: proc.deh || undefined,
    date2: proc.date2 || undefined,
    nout: proc.nout || undefined,
    dani: proc.dani || undefined,
    coment: proc.coment || undefined,
    vac1: proc.vac1 || undefined,
    vac2: proc.vac2 || undefined,
    vac3: proc.vac3 || undefined,
    vac4: proc.vac4 || undefined,
    vac5: proc.vac5 || undefined,
    vac6: proc.vac6 || undefined,
    vac7: proc.vac7 || undefined,
    vac8: proc.vac8 || undefined,
    vac9: proc.vac9 || undefined,
  };
}

const DRAFT_TTL = 24 * 60 * 60 * 1000;

function getDraftKey(petId: string) {
  return `visit-draft-${petId}`;
}

function saveDraft(data: VisitData) {
  try {
    localStorage.setItem(getDraftKey(data.petId), JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota */ }
}

function loadDraft(petId: string): VisitData | null {
  try {
    const raw = localStorage.getItem(getDraftKey(petId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > DRAFT_TTL) {
      localStorage.removeItem(getDraftKey(petId));
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function clearDraft(petId: string) {
  localStorage.removeItem(getDraftKey(petId));
}

/* ─── Quick-add chips ─── */

/* ─── Props ─── */

interface VisitBuilderProps {
  petId: string;
  petName: string;
  ownerPersonalId: string;
  ownerName: string;
  ownerPhone: string;
  onClose: () => void;
  onSuccess: () => void;
}

/* ─── Component ─── */

export function VisitBuilder({
  petId, petName, ownerPersonalId, ownerName, ownerPhone, onClose, onSuccess,
}: VisitBuilderProps) {
  const t = useTranslations("visit");
  const locale = useLocale();
  const queryClient = useQueryClient();

  // Data queries
  const { data: procTypes, isLoading: typesLoading } = useProcedureTypes();
  const { data: vaccineOpts } = useVaccineOptions();
  const { data: testOpts } = useTestOptions();
  const { data: dehelOpts } = useDehelOptions();
  const { data: ectoOpts } = useEctoOptions();
  const { data: prices, isLoading: pricesLoading } = useClinicPrices();
  const { data: staffList } = useClinicStaff();

  // Visit data
  const [visitData, setVisitData] = useState<VisitData>({
    petId, petName, ownerPersonalId, ownerName, ownerPhone,
    date: todayStr(), anam: "", diagn: "", koment: "", vetId: "",
    procedures: [],
  });

  // UI state
  const [step, setStep] = useState<Step>("build");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SubmissionResult[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Undo state for soft-delete
  const [undoItem, setUndoItem] = useState<{ proc: ProcedureEntry; timer: ReturnType<typeof setTimeout> } | null>(null);

  // Draft banner
  const [draftAvailable, setDraftAvailable] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft(petId);
    if (draft && draft.procedures.length > 0) {
      setDraftAvailable(true);
    }
  }, [petId]);

  // Back-fill prices when price data arrives (handles timing: user adds procedure before prices load)
  useEffect(() => {
    if (!prices || prices.length === 0) return;
    setVisitData((prev) => {
      const updated = prev.procedures.map((proc) => {
        if (proc.price && proc.price !== "0") return proc; // already has a price
        const matched = matchPrice(proc.tpname, prices);
        return matched ? { ...proc, price: matched } : proc;
      });
      if (updated.every((p, i) => p === prev.procedures[i])) return prev; // no changes
      return { ...prev, procedures: updated };
    });
  }, [prices]);

  // Autosave draft (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (step !== "build") return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveDraft(visitData), 1000);
    return () => clearTimeout(saveTimerRef.current);
  }, [visitData, step]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const restoreDraft = useCallback(() => {
    const draft = loadDraft(petId);
    if (draft) {
      setVisitData(draft);
      if (draft.procedures.length > 0) {
        setExpandedCardId(draft.procedures[0].clientId);
      }
    }
    setDraftAvailable(false);
  }, [petId]);

  const discardDraft = useCallback(() => {
    clearDraft(petId);
    setDraftAvailable(false);
  }, [petId]);

  // Procedure CRUD
  const addProcedure = useCallback((type: ProcedureTypeItem) => {
    const proc = makeProcedure(type, prices ?? []);
    setVisitData((prev) => ({
      ...prev,
      procedures: [...prev.procedures, proc],
    }));
    setExpandedCardId(proc.clientId);
    setSearchQuery("");
    setSearchOpen(false);
  }, [prices]);

  const updateProcedure = useCallback((clientId: string, updates: Partial<ProcedureEntry>) => {
    setVisitData((prev) => ({
      ...prev,
      procedures: prev.procedures.map((p) =>
        p.clientId === clientId ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const removeProcedure = useCallback((clientId: string) => {
    const proc = visitData.procedures.find((p) => p.clientId === clientId);
    if (!proc) return;

    // Clear previous undo timer
    if (undoItem) clearTimeout(undoItem.timer);

    setVisitData((prev) => ({
      ...prev,
      procedures: prev.procedures.filter((p) => p.clientId !== clientId),
    }));

    const timer = setTimeout(() => setUndoItem(null), 5000);
    setUndoItem({ proc, timer });
  }, [visitData.procedures, undoItem]);

  const undoRemove = useCallback(() => {
    if (!undoItem) return;
    clearTimeout(undoItem.timer);
    setVisitData((prev) => ({
      ...prev,
      procedures: [...prev.procedures, undoItem.proc],
    }));
    setUndoItem(null);
  }, [undoItem]);

  // Computed
  const subtotal = useMemo(() => {
    return round2(visitData.procedures.reduce((sum, p) => sum + parsePrice(p.price), 0));
  }, [visitData.procedures]);

  const discountAmount = round2(subtotal * discountPercent / 100);
  const total = round2(Math.max(0, subtotal - discountAmount));

  // Filtered procedure types for search
  const filteredTypes = useMemo(() => {
    if (!procTypes) return [];
    const q = searchQuery.toLowerCase();
    return procTypes.filter((t) => {
      const localName = localizeProcedureType(t.name, locale).toLowerCase();
      return t.name.toLowerCase().includes(q) || localName.includes(q);
    });
  }, [procTypes, searchQuery, locale]);

  // All procedure types for chips
  const allTypes = procTypes ?? [];

  // Validation
  const allValid = useMemo(() => {
    return visitData.procedures.every((proc) => {
      const config = getFieldConfig(proc.tp);
      if (!config.requiredFields?.length) return true;
      return config.requiredFields.every((f) => {
        const val = proc[f as keyof ProcedureEntry];
        return val !== undefined && val !== "";
      });
    });
  }, [visitData.procedures]);

  const canProceedToPayment = visitData.procedures.length > 0 && allValid;

  /* ─── Submission ─── */

  const submitVisit = useCallback(async () => {
    const token = getStoredSession()?.accessToken ?? "";
    if (!token) return;

    const visitId = genId();
    const procs = visitData.procedures;
    setSubmitting(true);
    setResults(procs.map((p) => ({ clientId: p.clientId, status: "pending" })));

    const savedIds: number[] = [];

    for (let i = 0; i < procs.length; i++) {
      const proc = procs[i];
      const body = buildProcBody(proc, visitData, petId, ownerPersonalId, ownerName, petName, visitId);

      try {
        const res = await fetch(`/api/clinic/procedures?token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        savedIds.push(data.id);

        setResults((prev) =>
          prev.map((r) =>
            r.clientId === proc.clientId ? { ...r, status: "success", serverId: data.id } : r
          ),
        );
      } catch (err) {
        setResults((prev) =>
          prev.map((r) =>
            r.clientId === proc.clientId
              ? { ...r, status: "error", error: err instanceof Error ? err.message : "Unknown error" }
              : r
          ),
        );
      }
    }

    // Check if all succeeded
    setResults((prev) => {
      const allSuccess = prev.every((r) => r.status === "success");
      if (allSuccess) {
        // Record payment
        recordPayment(savedIds, token, visitId);
      }
      setSubmitting(false);
      return prev;
    });
  }, [visitData, petId, ownerPersonalId, ownerName, ownerPhone, petName]);

  const recordPayment = useCallback(async (procedureIds: number[], token: string, visitId: string) => {
    try {
      const session = getStoredSession();
      const clinicName = session?.clinic?.companyName ?? "Clinic";

      const res = await fetch(`/api/clinic/payments?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: petId,
          owner: ownerPersonalId,
          amount: String(total),
          date: visitData.date,
          method: paymentMethod,
          procedure_ids: procedureIds,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Build receipt
      setReceiptData({
        petName,
        ownerName,
        date: visitData.date,
        clinicName,
        procedures: visitData.procedures.map((p) => ({
          name: localizeProcedureType(p.tpname, locale) + (p.vac ? ` — ${p.vac}` : ""),
          price: parsePrice(p.price),
        })),
        subtotal,
        discountPercent,
        discountAmount,
        total,
        method: paymentMethod,
      });

      clearDraft(petId);
      setStep("receipt");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Payment failed");
    }
  }, [petId, ownerPersonalId, total, visitData, paymentMethod, petName, ownerName, subtotal, discountPercent, discountAmount, locale]);

  const retryFailed = useCallback(async () => {
    const token = getStoredSession()?.accessToken ?? "";
    if (!token) return;
    const failed = results.filter((r) => r.status === "error");
    if (failed.length === 0) return;

    setSubmitting(true);

    for (const result of failed) {
      const proc = visitData.procedures.find((p) => p.clientId === result.clientId);
      if (!proc) continue;

      const retryVisitId = genId();
      const body = buildProcBody(proc, visitData, petId, ownerPersonalId, ownerName, petName, retryVisitId);

      try {
        const res = await fetch(`/api/clinic/procedures?token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        setResults((prev) =>
          prev.map((r) =>
            r.clientId === result.clientId ? { ...r, status: "success", serverId: data.id, error: undefined } : r
          ),
        );
      } catch (err) {
        setResults((prev) =>
          prev.map((r) =>
            r.clientId === result.clientId
              ? { ...r, error: err instanceof Error ? err.message : "Unknown error" }
              : r
          ),
        );
      }
    }

    setSubmitting(false);

    // Check if all good now, proceed to payment
    setResults((prev) => {
      const allSuccess = prev.every((r) => r.status === "success");
      if (allSuccess) {
        const ids = prev.map((r) => r.serverId!).filter(Boolean);
        recordPayment(ids, token, genId());
      }
      return prev;
    });
  }, [results, visitData, petId, ownerPersonalId, ownerName, ownerPhone, petName, recordPayment]);

  const handleDone = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["clinic-pet", petId] });
    onSuccess();
    onClose();
  }, [queryClient, petId, onSuccess, onClose]);

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const hasErrors = errorCount > 0;

  /* ─── Render ─── */

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-dark/30 backdrop-blur-sm animate-fade-in" onClick={step === "build" ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.12)] animate-modal-in overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">🩺</div>
            <div>
              <h2 className="text-lg font-bold text-primary-dark">{petName}</h2>
              <p className="text-xs text-foreground-muted/60">{ownerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-foreground-muted hover:bg-gray-200 transition-colors cursor-pointer">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Draft restore banner */}
          {draftAvailable && step === "build" && (
            <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <span className="text-sm text-amber-800">{t("draftRestore")}</span>
              <div className="ml-auto flex gap-2">
                <button onClick={restoreDraft} className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 cursor-pointer">
                  {t("restore")}
                </button>
                <button onClick={discardDraft} className="rounded-lg bg-white border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 cursor-pointer">
                  {t("discard")}
                </button>
              </div>
            </div>
          )}

          {/* Submission progress banner */}
          {submitting && (
            <div className="mx-6 mt-4 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3">
              <p className="text-sm text-blue-800">
                {t("saving")} ({successCount}/{visitData.procedures.length})
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(successCount / visitData.procedures.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Error banner with retry */}
          {!submitting && hasErrors && step === "pay" && (
            <div className="mx-6 mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-800">
                {t("partialError", { success: successCount, total: results.length })}
              </p>
              <button
                onClick={retryFailed}
                className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 cursor-pointer"
              >
                {t("retry")}
              </button>
            </div>
          )}

          {/* Step 1: Build */}
          {step === "build" && (
            <div className="px-6 py-4 space-y-4">
              {/* Shared fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("date")}</label>
                  <input
                    type="date"
                    value={visitData.date}
                    onChange={(e) => setVisitData((p) => ({ ...p, date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("anamnesis")}</label>
                  <input
                    type="text"
                    value={visitData.anam}
                    onChange={(e) => setVisitData((p) => ({ ...p, anam: e.target.value }))}
                    placeholder={t("anamnesisPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("diagnosis")}</label>
                  <input
                    type="text"
                    value={visitData.diagn}
                    onChange={(e) => setVisitData((p) => ({ ...p, diagn: e.target.value }))}
                    placeholder={t("diagnosisPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("vetNotes")}</label>
                  <input
                    type="text"
                    value={visitData.koment}
                    onChange={(e) => setVisitData((p) => ({ ...p, koment: e.target.value }))}
                    placeholder={t("vetNotesPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {staffList && staffList.length > 0 && (
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">ვეტერინარი</label>
                    <select
                      value={visitData.vetId}
                      onChange={(e) => setVisitData((p) => ({ ...p, vetId: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                    >
                      <option value="">— {t("select")} —</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={String(s.id)}>{s.first_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4" />

              {/* Procedure search */}
              <div ref={dropdownRef} className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted/40" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && filteredTypes.length > 0) {
                          addProcedure(filteredTypes[0]);
                        }
                        if (e.key === "Escape") setSearchOpen(false);
                      }}
                      placeholder={t("addProcedure")}
                      className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Procedure type chips */}
                {allTypes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {allTypes.map((type) => (
                      <button
                        key={type.tp}
                        onClick={() => addProcedure(type)}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-foreground-muted hover:bg-gray-100 hover:border-gray-300 transition-colors cursor-pointer"
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Search dropdown */}
                {searchOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                    {typesLoading ? (
                      <div className="px-4 py-3 text-sm text-foreground-muted/50">{t("loading")}</div>
                    ) : filteredTypes.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-foreground-muted/50">{t("noResults")}</div>
                    ) : (
                      filteredTypes.map((type) => (
                        <button
                          key={type.tp}
                          onClick={() => addProcedure(type)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <span className="font-medium text-primary-dark">
                            {localizeProcedureType(type.name, locale)}
                          </span>
                          <span className="text-xs text-foreground-muted/40">
                            {type.name !== localizeProcedureType(type.name, locale) ? type.name : ""}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Procedure cards */}
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
                      expanded={expandedCardId === proc.clientId}
                      onToggle={() => setExpandedCardId(expandedCardId === proc.clientId ? null : proc.clientId)}
                      onChange={(u) => updateProcedure(proc.clientId, u)}
                      onRemove={() => removeProcedure(proc.clientId)}
                      locale={locale}
                      t={t}
                      vaccineOpts={vaccineOpts}
                      testOpts={testOpts}
                      dehelOpts={dehelOpts}
                      ectoOpts={ectoOpts}
                      pricesLoading={pricesLoading}
                    />
                  ))}
                </div>
              )}

              {/* Undo toast */}
              {undoItem && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3 text-white shadow-lg animate-fade-in">
                  <span className="text-sm">{t("procedureRemoved")}</span>
                  <button onClick={undoRemove} className="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30 cursor-pointer">
                    {t("undo")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Payment (slides up) */}
          {step === "pay" && (
            <div className="px-6 py-4 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary-dark uppercase tracking-wider">{t("payment")}</h3>
                <button
                  onClick={() => setStep("build")}
                  className="flex items-center gap-1 text-xs text-foreground-muted hover:text-primary-dark cursor-pointer"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t("back")}
                </button>
              </div>

              {/* Summary table */}
              <div className="space-y-2">
                {visitData.procedures.map((proc) => (
                  <div key={proc.clientId} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-primary-dark">
                      {localizeProcedureType(proc.tpname, locale)}
                      {proc.vac ? <span className="text-foreground-muted/50 ml-1">— {proc.vac}</span> : null}
                    </span>
                    <span className="text-sm font-semibold text-primary-dark">{parsePrice(proc.price)} ₾</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="text-sm text-foreground-muted/60">{t("subtotal")}</span>
                <span className="text-sm font-semibold">{subtotal} ₾</span>
              </div>

              {/* Discount */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("discount")}</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[0, 10, 15, 20, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDiscountPercent(pct)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        discountPercent === pct
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-foreground-muted hover:bg-gray-200"
                      }`}
                    >
                      {pct === 0 ? t("noDiscount") : `${pct}%`}
                    </button>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={![0, 10, 15, 20, 50, 100].includes(discountPercent) ? discountPercent : ""}
                      onChange={(e) => {
                        const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        setDiscountPercent(v);
                      }}
                      placeholder={t("customPercent")}
                      className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-foreground-muted/50">%</span>
                  </div>
                </div>
              </div>

              {/* Discount display */}
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

              {/* Payment method */}
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-foreground-muted hover:border-gray-300"
                  }`}
                >
                  {t("cash")}
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-foreground-muted hover:border-gray-300"
                  }`}
                >
                  {t("card")}
                </button>
              </div>

              {/* Pay button */}
              <button
                onClick={submitVisit}
                disabled={submitting}
                className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? t("processing") : `${t("pay")} ${total} ₾`}
              </button>
            </div>
          )}

          {/* Receipt */}
          {step === "receipt" && receiptData && (
            <Receipt data={receiptData} t={t} locale={locale} onDone={handleDone} />
          )}
        </div>

        {/* Footer: Total + Continue (only in build step) */}
        {step === "build" && visitData.procedures.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-foreground-muted/50">{t("total")}</span>
                <span className="ml-2 text-lg font-bold text-primary-dark">
                  {pricesLoading ? "..." : `${subtotal} ₾`}
                </span>
              </div>
              <button
                onClick={() => setStep("pay")}
                disabled={!canProceedToPayment}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
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

interface ProcedureCardProps {
  proc: ProcedureEntry;
  expanded: boolean;
  onToggle: () => void;
  onChange: (updates: Partial<ProcedureEntry>) => void;
  onRemove: () => void;
  locale: string;
  t: ReturnType<typeof useTranslations<"visit">>;
  vaccineOpts?: { vaccines: SelectOption[]; brands: SelectOption[] };
  testOpts?: SelectOption[];
  dehelOpts?: SelectOption[];
  ectoOpts?: { drops: SelectOption[]; collars: SelectOption[]; tablets: SelectOption[] };
  pricesLoading: boolean;
}

function ProcedureCard({
  proc, expanded, onToggle, onChange, onRemove, locale, t,
  vaccineOpts, testOpts, dehelOpts, ectoOpts, pricesLoading,
}: ProcedureCardProps) {
  const config = getFieldConfig(proc.tp);
  const options = getDropdownOptions(config, vaccineOpts, testOpts, dehelOpts, ectoOpts);
  const brandOptions = getBrandOptions(config, vaccineOpts);
  const localizedName = localizeProcedureType(proc.tpname, locale);

  const isRequiredMissing = config.requiredFields?.some((f) => {
    const val = proc[f as keyof ProcedureEntry];
    return val === undefined || val === "";
  });

  const inputClass = "mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50";

  /** Get test result value from the correct field */
  const getTestVal = (field: string): string => proc[field as keyof ProcedureEntry] as string ?? "";
  const setTestVal = (field: string, val: string) => onChange({ [field]: val });

  return (
    <div className={`rounded-xl border transition-all ${isRequiredMissing ? "border-amber-200" : "border-gray-100"} bg-white hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex-1 flex items-center gap-3 text-left cursor-pointer">
          <svg className={`h-4 w-4 text-foreground-muted/40 transition-transform ${expanded ? "rotate-90" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="font-medium text-sm text-primary-dark">{localizedName}</span>
          {proc.vac && <span className="text-xs text-foreground-muted/50">{proc.vac}</span>}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={proc.price}
              onChange={(e) => onChange({ price: e.target.value })}
              placeholder={pricesLoading ? "..." : "0"}
              className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-sm text-right focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-foreground-muted/50">₾</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-foreground-muted/40 hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 py-3 space-y-3">

          {/* ── Vaccination: vac dropdown + brand + serial + next date ── */}
          {config.dropdownSource === "vaccine" && (
            <>
              <div>
                <label className={labelClass}>
                  {t("selectType")} {config.requiredFields?.includes("vac") && <span className="text-red-400">*</span>}
                </label>
                <select value={proc.vac} onChange={(e) => onChange({ vac: e.target.value })} className={`${inputClass} bg-white`}>
                  <option value="">{t("select")}</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {brandOptions.length > 0 && (
                <div>
                  <label className={labelClass}>{t("brand")}</label>
                  <select value={proc.vacn} onChange={(e) => onChange({ vacn: e.target.value })} className={`${inputClass} bg-white`}>
                    <option value="">{t("select")}</option>
                    {brandOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>{t("serial")}</label>
                <input type="text" value={proc.ser} onChange={(e) => onChange({ ser: e.target.value })} placeholder={t("serialPlaceholder")} className={inputClass} />
              </div>
            </>
          )}

          {/* ── Dehelminization: dehel drug dropdown + "other" free text ── */}
          {config.hasDeh && (
            <>
              <div>
                <label className={labelClass}>{t("dehelDrug")}</label>
                <select value={proc.deh} onChange={(e) => onChange({ deh: e.target.value })} className={`${inputClass} bg-white`}>
                  <option value="">{t("select")}</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                  <option value="სხვა">{t("other")}</option>
                </select>
              </div>
              {proc.deh === "სხვა" && (
                <div>
                  <label className={labelClass}>{t("other")}</label>
                  <input type="text" value={proc.vac} onChange={(e) => onChange({ vac: e.target.value })} placeholder={t("otherPlaceholder")} className={inputClass} />
                </div>
              )}
            </>
          )}

          {/* ── Ectoparasite: 4 category dropdowns matching PHP ── */}
          {config.ectoCategories && ectoOpts && (
            <>
              {ECTO_CATEGORIES.map((cat) => {
                const catOptions = ectoOpts[cat.optionsKey as keyof typeof ectoOpts] as SelectOption[] | undefined ?? [];
                const selectVal = getTestVal(cat.selectField);
                const otherVal = getTestVal(cat.otherField);
                return (
                  <div key={cat.id}>
                    <label className={labelClass}>{cat.label}</label>
                    <select
                      value={selectVal}
                      onChange={(e) => setTestVal(cat.selectField, e.target.value)}
                      className={`${inputClass} bg-white`}
                    >
                      <option value="">{t("select")}</option>
                      {catOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                      <option value="სხვა">{t("other")}</option>
                    </select>
                    {selectVal === "სხვა" && (
                      <input
                        type="text"
                        value={otherVal}
                        onChange={(e) => setTestVal(cat.otherField, e.target.value)}
                        placeholder={t("otherPlaceholder")}
                        className={`${inputClass} mt-1`}
                      />
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ── Test: Named test panels with pos/neg radio buttons ── */}
          {config.hasTestPanels && (
            <div className="space-y-2">
              {TEST_PANELS.map((panel) => {
                const isGroup = !!panel.subtests;
                return (
                  <div key={panel.id} className="rounded-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-primary-dark">{panel.label}</div>
                    <div className="px-3 py-2">
                      {isGroup ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {panel.subtests!.map((sub) => (
                            <div key={sub.field}>
                              <span className="text-xs font-medium text-foreground-muted/70">{sub.label}</span>
                              <div className="flex gap-3 mt-1">
                                <label className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`${proc.clientId}-${sub.field}`}
                                    checked={getTestVal(sub.field) === "უარყოფითი"}
                                    onChange={() => setTestVal(sub.field, "უარყოფითი")}
                                    className="accent-primary"
                                  />
                                  {t("negative")}
                                </label>
                                <label className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`${proc.clientId}-${sub.field}`}
                                    checked={getTestVal(sub.field) === "დადებითი"}
                                    onChange={() => setTestVal(sub.field, "დადებითი")}
                                    className="accent-primary"
                                  />
                                  {t("positive")}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name={`${proc.clientId}-${panel.field}`}
                              checked={getTestVal(panel.field) === "უარყოფითი"}
                              onChange={() => setTestVal(panel.field, "უარყოფითი")}
                              className="accent-primary"
                            />
                            {t("negative")}
                          </label>
                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name={`${proc.clientId}-${panel.field}`}
                              checked={getTestVal(panel.field) === "დადებითი"}
                              onChange={() => setTestVal(panel.field, "დადებითი")}
                              className="accent-primary"
                            />
                            {t("positive")}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Next due date ── */}
          {config.hasDate2 && (
            <div>
              <label className={labelClass}>{t("nextDueDate")}</label>
              <input type="date" value={proc.date2} onChange={(e) => onChange({ date2: e.target.value })} className={inputClass} />
            </div>
          )}

          {/* ── Treatment ── */}
          {config.hasNout && (
            <div>
              <label className={labelClass}>{t("treatment")}</label>
              <input type="text" value={proc.nout} onChange={(e) => onChange({ nout: e.target.value })} placeholder={t("treatmentPlaceholder")} className={inputClass} />
            </div>
          )}

          {/* ── Prescription ── */}
          {config.hasDani && (
            <div>
              <label className={labelClass}>{t("prescription")}</label>
              <input type="text" value={proc.dani} onChange={(e) => onChange({ dani: e.target.value })} placeholder={t("prescriptionPlaceholder")} className={inputClass} />
            </div>
          )}

          {/* ── Comment ── */}
          {config.hasComent && (
            <div>
              <label className={labelClass}>{t("ownerComment")}</label>
              <input type="text" value={proc.coment} onChange={(e) => onChange({ coment: e.target.value })} placeholder={t("ownerCommentPlaceholder")} className={inputClass} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Receipt ─── */

interface ReceiptProps {
  data: ReceiptData;
  t: ReturnType<typeof useTranslations<"visit">>;
  locale: string;
  onDone: () => void;
}

function Receipt({ data, t, locale, onDone }: ReceiptProps) {
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
