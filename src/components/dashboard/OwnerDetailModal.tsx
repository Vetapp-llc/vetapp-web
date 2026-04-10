"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useOwnerDetail } from "@/lib/hooks/useClinicData";
import { localizeSpeciesValue, localizeSex } from "@/lib/utils/localize";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />;
}

interface OwnerDetailModalProps {
  open: boolean;
  personalId: string | null;
  onClose: () => void;
  onViewPet: (petId: string) => void;
}

export function OwnerDetailModal({ open, personalId, onClose, onViewPet }: OwnerDetailModalProps) {
  const t = useTranslations("clinic");
  const locale = useLocale();
  const { data: owner, isLoading } = useOwnerDetail(open ? personalId : null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-dark/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.12)] animate-modal-in">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-foreground-muted hover:bg-gray-200 transition-colors cursor-pointer">
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isLoading && (
          <div className="space-y-4 p-6">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {owner && (
          <div>
            {/* Owner header */}
            <div className="bg-gradient-to-r from-primary/5 to-transparent px-6 pt-6 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary-dark">{owner.name}</h2>
                  {owner.personalId && (
                    <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      ID: {owner.personalId}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {owner.phone && (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("phone")}</p>
                    <p className="text-sm font-semibold text-primary-dark">{owner.phone}</p>
                  </div>
                )}
                {owner.email && (
                  <div className="rounded-xl bg-white/80 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50">{t("email")}</p>
                    <p className="text-sm font-semibold text-primary-dark truncate">{owner.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pets grid */}
            <div className="px-6 pb-6">
              <h3 className="mb-3 text-sm font-bold text-primary-dark">
                {t("pets")}
                <span className="ml-1.5 text-foreground-muted/40 font-normal">({owner.pets?.length ?? 0})</span>
              </h3>

              {!owner.pets?.length ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
                  <p className="text-sm text-foreground-muted/50">{t("noPets")}</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {(owner.pets ?? []).map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => onViewPet(String(pet.id))}
                      className="group w-full rounded-xl border border-gray-100 bg-white p-4 text-left transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-primary/20 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg transition-colors group-hover:bg-primary group-hover:text-white">
                          {pet.species?.toLowerCase().includes("ძაღლ") || pet.species?.toLowerCase() === "dog" ? "🐕" : pet.species?.toLowerCase().includes("კატ") || pet.species?.toLowerCase() === "cat" ? "🐈" : "🐾"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-primary-dark">{pet.name}</p>
                          <p className="text-xs text-foreground-muted/50 truncate">
                            {localizeSpeciesValue(pet.species ?? "", locale)}
                            {pet.breed ? ` · ${pet.breed}` : ""}
                            {pet.sex ? ` · ${localizeSex(pet.sex, locale)}` : ""}
                          </p>
                        </div>
                        <svg className="h-4 w-4 text-foreground-muted/20 group-hover:text-primary transition-colors" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
