"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { usePetDetail } from "@/lib/hooks/useClinicData";
import { PetRecords } from "./pet/PetRecords";
import { AllergiesPanel, BookAppointmentModal, CertificateModal, EditPetModal, PetAppointments } from "./pet/PetExtras";
import { localizeSpeciesValue, localizeSex, speciesEmoji, speciesKey as speciesKeyOf } from "@/lib/utils/localize";
import { useBackClose } from "@/lib/hooks/useBackClose";
import { VisitBuilder } from "./VisitBuilder";

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

/* ─── Main Modal ─── */
interface PetDetailModalProps {
  open: boolean;
  petId: string | null;
  /** Owner personal ID the pet was found by — lets a clinic open a pet registered elsewhere. */
  ownerProof?: string;
  onClose: () => void;
  onViewOwner: (personalId: string) => void;
}

export function PetDetailModal({ open, petId, ownerProof, onClose, onViewOwner }: PetDetailModalProps) {
  const t = useTranslations("clinic");
  const locale = useLocale();
  const tf = useTranslations("features");
  const queryClient = useQueryClient();
  const { data: pet, isLoading } = usePetDetail(open ? petId : null, ownerProof);
  const [tab, setTab] = useState<"records" | "allergies" | "appointments">("records");
  const [visitBuilderOpen, setVisitBuilderOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  useBackClose(open, onClose);

  useEffect(() => {
    if (open) setTab("records");
  }, [open, petId]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

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
              {/* pr-10 keeps the name row clear of the close button */}
              <div className="flex items-center gap-4 pr-10">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary text-2xl">
                  {speciesEmoji(pet.species)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="min-w-0 text-xl font-bold leading-tight text-primary-dark">{pet.name}</h2>
                    <button
                      onClick={() => setEditOpen(true)}
                      aria-label={tf("editPet")}
                      title={tf("editPet")}
                      className="-m-1.5 flex shrink-0 items-center justify-center rounded-lg p-1.5 text-primary hover:text-primary/70 transition-colors cursor-pointer"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-foreground-muted/60">
                    {localizeSpeciesValue(pet.species, locale)}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                    {pet.sex ? ` · ${localizeSex(pet.sex, locale)}` : ""}
                    {pet.birth ? ` · ${tf("birthShort")} ${formatDate(pet.birth)}` : ""}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setVisitBuilderOpen(true)}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-white hover:bg-primary/90 transition-colors cursor-pointer sm:gap-1.5 sm:px-4 sm:text-xs"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  {tf("addProcedure")}
                </button>
                <button
                  onClick={() => setBookOpen(true)}
                  className="inline-flex items-center rounded-xl border border-primary/30 bg-white px-3 py-2 text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer sm:px-4 sm:text-xs"
                >
                  {tf("bookAppointment")}
                </button>
                <button
                  onClick={() => setCertOpen(true)}
                  className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-primary-dark hover:bg-gray-50 transition-colors cursor-pointer sm:px-4 sm:text-xs"
                >
                  {tf("certificate")}
                </button>
              </div>

              {/* Pet info grid */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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

            {/* Records / allergies / appointments */}
            <div className="px-6 pb-6">
              <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
                {([
                  ["records", tf("records")],
                  ["allergies", tf("allergies")],
                  ["appointments", tf("appointments")],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      tab === id ? "bg-primary text-white" : "bg-gray-100 text-foreground-muted hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {tab === "records" && <PetRecords petId={String(pet.id ?? petId)} species={speciesKeyOf(pet.species)} />}
              {tab === "allergies" && <AllergiesPanel petId={String(pet.id ?? petId)} ownerId={pet.ownerPersonalId} />}
              {tab === "appointments" && <PetAppointments petId={String(pet.id ?? petId)} />}
            </div>
          </div>
        )}

        {/* Visit Builder overlay */}
        {visitBuilderOpen && pet && (
          <VisitBuilder
            petId={pet.id?.toString() ?? petId ?? ""}
            petName={pet.name ?? ""}
            species={pet.species ?? ""}
            ownerPersonalId={pet.ownerPersonalId ?? ""}
            ownerName={pet.ownerName ?? ""}
            ownerPhone={pet.ownerPhone ?? ""}
            onClose={() => setVisitBuilderOpen(false)}
            onSuccess={() => setVisitBuilderOpen(false)}
          />
        )}

        {editOpen && pet && (
          <EditPetModal
            pet={{
              id: String(pet.id ?? petId), name: pet.name, species: pet.species, breed: pet.breed, sex: pet.sex,
              color: pet.color, birth: pet.birth, chip: pet.chip, chipDate: pet.chipDate, cast: pet.cast,
              castDate: pet.castDate, ownerPersonalId: pet.ownerPersonalId, ownerName: pet.ownerName,
              ownerPhone: pet.ownerPhone, ownerEmail: pet.ownerEmail,
            }}
            onClose={() => setEditOpen(false)}
            onSaved={() => {
              setEditOpen(false);
              queryClient.invalidateQueries({ queryKey: ["clinic-pet", petId] });
              queryClient.invalidateQueries({ queryKey: ["clinic-pets"] });
            }}
          />
        )}
        {bookOpen && pet && (
          <BookAppointmentModal
            petId={String(pet.id ?? petId)}
            petName={pet.name}
            ownerId={pet.ownerPersonalId}
            onClose={() => setBookOpen(false)}
            onBooked={() => {
              setBookOpen(false);
              queryClient.invalidateQueries({ queryKey: ["appointments"] });
              setTab("appointments");
            }}
          />
        )}
        {certOpen && pet && <CertificateModal petId={String(pet.id ?? petId)} ownerId={pet.ownerPersonalId} onClose={() => setCertOpen(false)} />}
      </div>
    </div>
  );
}
