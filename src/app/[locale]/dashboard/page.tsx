"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePets, useOwners, useClinicStats } from "@/lib/hooks/useClinicData";
import { StatsTab } from "@/components/dashboard/StatsTab";
import { localizeSpeciesValue, localizeSex } from "@/lib/utils/localize";
import { getStoredSession } from "@/lib/utils/session";
import { Pagination } from "@/components/dashboard/Pagination";
import { PetDetailModal } from "@/components/dashboard/PetDetailModal";
import { OwnerDetailModal } from "@/components/dashboard/OwnerDetailModal";



/* ═══════════════════════════════════════════════════════
   ─── TAB: PETS (real data) ───
   ═══════════════════════════════════════════════════════ */
function PetsTab({ onViewPet }: { onViewPet: (id: string) => void }) {
  const t = useTranslations("clinic");
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = usePets(page, 20, debouncedSearch);

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted/40" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPets")}
            className="w-full rounded-2xl border border-border/40 bg-white pl-11 pr-4 py-3 text-sm text-primary-dark shadow-[0_2px_12px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-foreground-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="h-3 w-48 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          <p className="mb-3 text-xs text-foreground-muted/50">
            {t("totalResults", { count: data.total })}
          </p>
          <div className="space-y-2">
            {data.data.map((pet) => (
              <button
                key={pet.id}
                onClick={() => onViewPet(String(pet.id))}
                className="group w-full rounded-xl bg-white p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-lg transition-colors group-hover:bg-primary group-hover:text-white">
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
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-medium text-primary-dark">{pet.ownerName}</p>
                    <p className="text-xs text-foreground-muted/40">{pet.ownerPhone}</p>
                  </div>
                  {pet.chip && (
                    <span className="hidden md:inline-flex rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-foreground-muted/50">
                      {pet.chip}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ─── TAB: OWNERS (real data) ───
   ═══════════════════════════════════════════════════════ */
function OwnersTab({ onViewOwner }: { onViewOwner: (personalId: string) => void }) {
  const t = useTranslations("clinic");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useOwners(page, 20, debouncedSearch);

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted/40" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchOwners")}
            className="w-full rounded-2xl border border-border/40 bg-white pl-11 pr-4 py-3 text-sm text-primary-dark shadow-[0_2px_12px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-foreground-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="h-3 w-48 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          <p className="mb-3 text-xs text-foreground-muted/50">
            {t("totalResults", { count: data.total })}
          </p>
          <div className="space-y-2">
            {data.data.map((owner) => (
              <button
                key={owner.personalId}
                onClick={() => onViewOwner(owner.personalId ?? "")}
                className="group w-full rounded-xl bg-white p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-dark">{owner.name}</p>
                    <p className="text-xs text-foreground-muted/50 truncate">
                      {owner.phone ? `${owner.phone}` : ""}
                      {owner.email ? ` · ${owner.email}` : ""}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {owner.petCount} {owner.petCount === 1 ? t("pet") : t("petsPlural")}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ─── TAB: SEARCH (real API) ───
   ═══════════════════════════════════════════════════════ */
function SearchTab({ onViewOwner }: { onViewOwner: (personalId: string) => void }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("clinic");

  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(() => {
    if (!query.trim()) return;
    setActiveSearch(query.trim());
    setSearched(true);
  }, [query]);

  const { data, isLoading } = useOwners(1, 50, activeSearch);

  return (
    <div>
      {/* Search Hero */}
      <div className={`transition-all duration-500 ${searched ? "mb-8" : "mb-0 pt-[6vh]"}`}>
        <div className={`text-center transition-all duration-500 ${searched ? "mb-5" : "mb-8"}`}>
          <h1 className={`font-extrabold tracking-tight text-primary-dark transition-all duration-500 ${searched ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
            {t("searchTitle")}
          </h1>
          {!searched && <p className="mt-2 text-sm text-foreground-muted/60">{t("searchDesc")}</p>}
        </div>
        <div className="mx-auto max-w-xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-foreground-muted/40" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input
                type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-2xl border border-border/40 bg-white pl-11 pr-4 py-3.5 text-sm text-primary-dark shadow-[0_2px_12px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-foreground-muted/40 focus:border-primary focus:shadow-[0_4px_24px_rgba(4,114,216,0.12)] focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button onClick={doSearch} className="rounded-2xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(4,114,216,0.25)] transition-all hover:bg-primary/90 hover:shadow-[0_8px_32px_rgba(4,114,216,0.35)] active:scale-[0.97] cursor-pointer">{t("search")}</button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {searched && isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-100" />
                  <div className="h-3 w-48 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {searched && data && data.data.length > 0 && (
        <div className="animate-results-in">
          <p className="mb-3 text-xs text-foreground-muted/50">
            {tc("totalResults", { count: data.total })}
          </p>
          <div className="space-y-2">
            {data.data.map((owner) => (
              <button
                key={owner.personalId}
                onClick={() => onViewOwner(owner.personalId ?? "")}
                className="group w-full rounded-xl bg-white p-4 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-dark">{owner.name}</p>
                    <p className="text-xs text-foreground-muted/50 truncate">
                      {owner.personalId}
                      {owner.phone ? ` · ${owner.phone}` : ""}
                      {owner.email ? ` · ${owner.email}` : ""}
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {owner.petCount} {owner.petCount === 1 ? tc("pet") : tc("petsPlural")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not found */}
      {searched && !isLoading && data && data.data.length === 0 && (
        <div className="animate-results-in mx-auto max-w-md text-center">
          <div className="rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-400">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M8 11h6" /></svg>
            </div>
            <h3 className="text-lg font-bold text-primary-dark">{t("notFound")}</h3>
            <p className="mt-1.5 text-sm text-foreground-muted/60">{t("notFoundDesc")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ─── MAIN DASHBOARD PAGE ───
   ═══════════════════════════════════════════════════════ */
type TabId = "stats" | "pets" | "owners" | "search";

export default function DashboardPage() {
  const t = useTranslations("clinic");
  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [hasToken, setHasToken] = useState(false);

  // Pet detail modal
  const [petModalId, setPetModalId] = useState<string | null>(null);
  const [petModalOpen, setPetModalOpen] = useState(false);

  // Owner detail modal
  const [ownerModalId, setOwnerModalId] = useState<string | null>(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  useEffect(() => {
    setHasToken(!!getStoredSession()?.accessToken);
  }, []);

  const openPetModal = (id: string) => {
    setOwnerModalOpen(false);
    setPetModalId(id);
    setPetModalOpen(true);
  };

  const openOwnerModal = (personalId: string) => {
    setPetModalOpen(false);
    setOwnerModalId(personalId);
    setOwnerModalOpen(true);
  };

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: "stats",
      label: t("statsTab"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
    },
    {
      id: "pets",
      label: t("petsTab"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM3 9c-1.38 0-2.5 1.12-2.5 2.5S1.62 14 3 14s2.5-1.12 2.5-2.5S4.38 9 3 9zM17 9c-1.38 0-2.5 1.12-2.5 2.5S15.62 14 17 14s2.5-1.12 2.5-2.5S18.38 9 17 9zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>,
    },
    {
      id: "owners",
      label: t("ownersTab"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>,
    },
    {
      id: "search",
      label: t("searchTab"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
    },
  ];

  // If no token (not logged in via backend), only show search tab
  if (!hasToken) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <SearchTab onViewOwner={openOwnerModal} />
        <OwnerDetailModal
          open={ownerModalOpen}
          personalId={ownerModalId}
          onClose={() => setOwnerModalOpen(false)}
          onViewPet={openPetModal}
        />
        <PetDetailModal
          open={petModalOpen}
          petId={petModalId}
          onClose={() => setPetModalOpen(false)}
          onViewOwner={openOwnerModal}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Tab Bar */}
      <div className="mb-6 flex gap-1 rounded-2xl bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-primary shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
                : "text-foreground-muted/60 hover:text-foreground-muted"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "stats" && <StatsTab />}
      {activeTab === "pets" && <PetsTab onViewPet={openPetModal} />}
      {activeTab === "owners" && <OwnersTab onViewOwner={openOwnerModal} />}
      {activeTab === "search" && <SearchTab onViewOwner={openOwnerModal} />}

      {/* Detail Modals */}
      <PetDetailModal
        open={petModalOpen}
        petId={petModalId}
        onClose={() => setPetModalOpen(false)}
        onViewOwner={openOwnerModal}
      />
      <OwnerDetailModal
        open={ownerModalOpen}
        personalId={ownerModalId}
        onClose={() => setOwnerModalOpen(false)}
        onViewPet={openPetModal}
      />
    </div>
  );
}
