"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePetDetail } from "@/lib/hooks/useClinicData";
import { localizeProcedureType, localizeSpeciesValue, localizeSex } from "@/lib/utils/localize";
import { VisitBuilder } from "./VisitBuilder";
import type { MedicalRecord } from "@/lib/types/api";

const PROCEDURE_COLORS: Record<string, string> = {
  ვაქცინაცია: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Vaccination: "bg-emerald-50 text-emerald-700 border-emerald-200",
  დეჰელმინთიზაცია: "bg-amber-50 text-amber-700 border-amber-200",
  Deworming: "bg-amber-50 text-amber-700 border-amber-200",
  ექტოპარაზიტები: "bg-orange-50 text-orange-700 border-orange-200",
  Ectoparasites: "bg-orange-50 text-orange-700 border-orange-200",
  კონსულტაცია: "bg-blue-50 text-blue-700 border-blue-200",
  Consultation: "bg-blue-50 text-blue-700 border-blue-200",
  ოპერაცია: "bg-red-50 text-red-700 border-red-200",
  Surgery: "bg-red-50 text-red-700 border-red-200",
  ლაბორატორია: "bg-purple-50 text-purple-700 border-purple-200",
  Laboratory: "bg-purple-50 text-purple-700 border-purple-200",
  ტესტი: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Test: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function renderTextWithBreaks(text: string) {
  const parts = text.split(/<br\s*\/?>/gi);
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && <br />}
    </span>
  ));
}

function getBadgeColor(type: string): string {
  return PROCEDURE_COLORS[type] ?? "bg-gray-50 text-gray-700 border-gray-200";
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB");
  } catch {
    return d;
  }
}

/* ─── Skeleton ─── */
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-px w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

/* ─── Record Card ─── */
function RecordCard({ record, locale, t }: { record: MedicalRecord; locale: string; t: ReturnType<typeof useTranslations<"clinic">> }) {
  const [expanded, setExpanded] = useState(false);
  const localizedType = localizeProcedureType(record.procedureType, locale);
  const badgeColor = getBadgeColor(record.procedureType) || getBadgeColor(localizedType);

  return (
    <div className="rounded-xl border border-gray-100 bg-white transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${badgeColor}`}>
              {localizedType}
            </span>
            {record.procedureName && (
              <span className="text-xs text-foreground-muted/60 truncate">{record.procedureName}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-foreground-muted/50">
            {formatDate(record.date ?? null)}
            {record.vetName ? ` · ${record.vetName}` : ""}
            {record.price ? ` · ${record.price} ₾` : ""}
          </p>
        </div>
        <svg className={`h-4 w-4 text-foreground-muted/40 transition-transform ${expanded ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 py-3 space-y-2 text-sm">
          {record.diagnosis && (
            <div>
              <span className="text-xs font-semibold uppercase text-foreground-muted/50">{t("diagnosis")}</span>
              <p className="text-primary-dark">{renderTextWithBreaks(record.diagnosis)}</p>
            </div>
          )}
          {record.anamnesis && (
            <div>
              <span className="text-xs font-semibold uppercase text-foreground-muted/50">{t("anamnesis")}</span>
              <p className="text-primary-dark">{renderTextWithBreaks(record.anamnesis)}</p>
            </div>
          )}
          {record.notes && (
            <div>
              <span className="text-xs font-semibold uppercase text-foreground-muted/50">{t("notes")}</span>
              <p className="text-primary-dark">{renderTextWithBreaks(record.notes)}</p>
            </div>
          )}
          {record.comment && (
            <div>
              <span className="text-xs font-semibold uppercase text-foreground-muted/50">{t("comment")}</span>
              <p className="text-primary-dark">{renderTextWithBreaks(record.comment)}</p>
            </div>
          )}
          {record.vaccinations.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase text-foreground-muted/50">{t("vaccinesGiven")}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {record.vaccinations.map((v: string, i: number) => (
                  <span key={i} className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700">{v}</span>
                ))}
              </div>
            </div>
          )}
          {record.tests.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase text-foreground-muted/50">{t("tests")}</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {record.tests.map((v: string, i: number) => (
                  <span key={i} className="rounded-lg bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs text-indigo-700">{v}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Modal ─── */
interface PetDetailModalProps {
  open: boolean;
  petId: string | null;
  onClose: () => void;
  onViewOwner: (personalId: string) => void;
}

export function PetDetailModal({ open, petId, onClose, onViewOwner }: PetDetailModalProps) {
  const t = useTranslations("clinic");
  const locale = useLocale();
  const { data: pet, isLoading } = usePetDetail(open ? petId : null);
  const [filterType, setFilterType] = useState<string>("all");
  const [visitBuilderOpen, setVisitBuilderOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  // Get unique procedure types for filter tabs
  const records: MedicalRecord[] = pet?.medicalRecords || [];
  const procedureTypes: string[] = pet
    ? [...new Set(records.map((r: MedicalRecord) => r.procedureType).filter(Boolean))]
    : [];

  const filteredRecords: MedicalRecord[] = pet
    ? filterType === "all"
      ? records
      : records.filter((r: MedicalRecord) => r.procedureType === filterType)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-dark/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.12)] animate-modal-in">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-foreground-muted hover:bg-gray-200 transition-colors cursor-pointer">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isLoading && <LoadingSkeleton />}

        {pet && (
          <div>
            {/* Pet Header */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 pt-6 pb-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl">
                  {pet.species.toLowerCase().includes("ძაღლ") || pet.species.toLowerCase() === "dog" ? "🐕" : pet.species.toLowerCase().includes("კატ") || pet.species.toLowerCase() === "cat" ? "🐈" : "🐾"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary-dark">{pet.name}</h2>
                  <p className="text-sm text-foreground-muted/60">
                    {localizeSpeciesValue(pet.species, locale)}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                    {pet.sex ? ` · ${localizeSex(pet.sex, locale)}` : ""}
                  </p>
                </div>
              </div>

              {/* New Visit button */}
              <button
                onClick={() => setVisitBuilderOpen(true)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {t("newVisit")}
              </button>

              {/* Pet info grid */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pet.birth && (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("birthDate")}</p>
                    <p className="text-sm font-semibold text-primary-dark">{formatDate(pet.birth)}</p>
                  </div>
                )}
                {pet.color && (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("color")}</p>
                    <p className="text-sm font-semibold text-primary-dark">{pet.color}</p>
                  </div>
                )}
                {pet.chip && (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("chip")}</p>
                    <p className="text-sm font-semibold text-primary-dark truncate">{pet.chip}</p>
                  </div>
                )}
                {pet.castrated && (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("castrated")}</p>
                    <p className="text-sm font-semibold text-primary-dark">{formatDate(pet.castDate)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Owner card */}
            {pet.ownerName && (
              <div className="mx-6 mt-1 mb-4">
                <button
                  onClick={() => {
                    if (pet.ownerPersonalId) onViewOwner(pet.ownerPersonalId);
                  }}
                  className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-left transition-all hover:bg-gray-100/70 hover:border-gray-200 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-foreground-muted/50">{t("owner")}</p>
                      <p className="text-sm font-bold text-primary-dark">{pet.ownerName}</p>
                      <p className="text-xs text-foreground-muted/50">
                        {[pet.ownerPhone, pet.ownerEmail].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <svg className="h-4 w-4 text-foreground-muted/30" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </button>
              </div>
            )}

            {/* Medical History */}
            <div className="px-6 pb-6">
              <h3 className="mb-3 text-sm font-bold text-primary-dark">
                {t("medicalHistory")}
                <span className="ml-1.5 text-foreground-muted/40 font-normal">({records.length})</span>
              </h3>

              {/* Filter tabs */}
              {procedureTypes.length > 1 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      filterType === "all"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-foreground-muted hover:bg-gray-200"
                    }`}
                  >
                    {t("all")} ({records.length})
                  </button>
                  {procedureTypes.map((type: string) => {
                    const count = records.filter((r: MedicalRecord) => r.procedureType === type).length;
                    return (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                          filterType === type
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-foreground-muted hover:bg-gray-200"
                        }`}
                      >
                        {localizeProcedureType(type, locale)} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredRecords.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
                  <p className="text-sm text-foreground-muted/50">{t("noRecords")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map((record: MedicalRecord) => (
                    <RecordCard key={record.id} record={record} locale={locale} t={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visit Builder overlay */}
        {visitBuilderOpen && pet && (
          <VisitBuilder
            petId={pet.id?.toString() ?? petId ?? ""}
            petName={pet.name ?? ""}
            ownerPersonalId={pet.ownerPersonalId ?? ""}
            ownerName={pet.ownerName ?? ""}
            ownerPhone={pet.ownerPhone ?? ""}
            onClose={() => setVisitBuilderOpen(false)}
            onSuccess={() => setVisitBuilderOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
