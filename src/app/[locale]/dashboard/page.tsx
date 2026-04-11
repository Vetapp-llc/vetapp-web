"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePets, useOwners, useClinicStats } from "@/lib/hooks/useClinicData";
import { StatsTab } from "@/components/dashboard/StatsTab";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { localizeSpeciesValue, localizeSex } from "@/lib/utils/localize";
import { getStoredSession, getClinicInfo } from "@/lib/utils/session";
import { Pagination } from "@/components/dashboard/Pagination";
import { PetDetailModal } from "@/components/dashboard/PetDetailModal";
import { OwnerDetailModal } from "@/components/dashboard/OwnerDetailModal";
import { useDashboardView } from "@/lib/context/DashboardViewContext";
import type { ViewId } from "@/lib/context/DashboardViewContext";
import breedsData from "@/lib/data/breeds.json";

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
                    {pet.species.toLowerCase().includes("ძაღლ") || pet.species.toLowerCase() === "dog" ? "🐕" : pet.species.toLowerCase().includes("კატ") || pet.species.toLowerCase() === "cat" ? "🐈" : "🐾"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary-dark">{pet.name}</p>
                    <p className="text-xs text-foreground-muted/50 truncate">
                      {localizeSpeciesValue(pet.species, locale)}
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
                onClick={() => onViewOwner(owner.personalId)}
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
   ─── TAB: SEARCH (ID search — home view) ───
   ═══════════════════════════════════════════════════════ */
function SearchTab({ onViewOwner, onAdd }: { onViewOwner: (personalId: string) => void; onAdd: (prefillId?: string) => void }) {
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

  const { data, isLoading, isFetching } = useOwners(1, 50, activeSearch);

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
            <button
              onClick={() => onAdd()}
              className="flex items-center justify-center rounded-2xl border border-border/40 bg-white px-3.5 py-3.5 text-foreground-muted/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all hover:border-primary hover:text-primary active:scale-[0.97] cursor-pointer"
              title={t("addOwnerPet")}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {searched && (isLoading || isFetching) && (
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
      {searched && !isFetching && data && data.data.length > 0 && (
        <div className="animate-results-in">
          <p className="mb-3 text-xs text-foreground-muted/50">
            {tc("totalResults", { count: data.total })}
          </p>
          <div className="space-y-2">
            {data.data.map((owner) => (
              <button
                key={owner.personalId}
                onClick={() => onViewOwner(owner.personalId)}
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
      {searched && !isLoading && !isFetching && data && data.data.length === 0 && (
        <div className="animate-results-in mx-auto max-w-md text-center">
          <div className="rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-400">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /><path d="M8 11h6" /></svg>
            </div>
            <h3 className="text-lg font-bold text-primary-dark">{t("notFound")}</h3>
            <p className="mt-1.5 text-sm text-foreground-muted/60">{t("notFoundDesc")}</p>
            <button
              onClick={() => onAdd(activeSearch)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(4,114,216,0.25)] transition-all hover:bg-primary/90 active:scale-[0.97] cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              {t("createOwner")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ─── WIDE SEARCH TAB ───
   ═══════════════════════════════════════════════════════ */
function WideSearchTab({ onViewOwner }: { onViewOwner: (personalId: string) => void }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("clinic");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useOwners(1, 50, debouncedSearch);
  // Hide stale results while debounce or fetch is in progress
  const isSearching = search !== debouncedSearch || isFetching;
  const showResults = debouncedSearch && !isSearching && data;

  return (
    <div>
      <div className="mb-5">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted/40" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("wideSearchPlaceholder")}
            className="w-full rounded-2xl border border-border/40 bg-white pl-11 pr-4 py-3.5 text-sm text-primary-dark shadow-[0_2px_12px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-foreground-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {((isLoading && debouncedSearch) || (search && isSearching)) && (
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

      {showResults && data.data.length > 0 && (
        <>
          <p className="mb-3 text-xs text-foreground-muted/50">
            {tc("totalResults", { count: data.total })}
          </p>
          <div className="space-y-2">
            {data.data.map((owner) => (
              <button
                key={owner.personalId}
                onClick={() => onViewOwner(owner.personalId)}
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
        </>
      )}

      {showResults && data.data.length === 0 && (
        <div className="mx-auto max-w-md text-center">
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
   ─── BREED COMBOBOX ───
   ═══════════════════════════════════════════════════════ */
function BreedCombobox({ species, value, onChange, locale, className, required, placeholder }: {
  species: string; value: string; onChange: (v: string) => void; locale: string; className: string; required?: boolean; placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const breeds = useMemo(() => {
    const list = species === "dog" ? breedsData.dogBreeds : species === "cat" ? breedsData.catBreeds : [];
    return list.map(b => ({ en: b.en, ka: b.ka, display: locale === "ka" ? b.ka : b.en }));
  }, [species, locale]);

  const filtered = useMemo(() => {
    if (!query.trim()) return breeds;
    const q = query.toLowerCase();
    return breeds.filter(b => b.en.toLowerCase().includes(q) || b.ka.toLowerCase().includes(q));
  }, [breeds, query]);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (species !== "dog" && species !== "cat") {
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={className} required={required} placeholder={placeholder} />;
  }

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => setOpen(true)}
        className={className}
        required={required}
        placeholder={placeholder}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-border/20">
          {filtered.slice(0, 50).map((b) => (
            <button
              key={b.en}
              type="button"
              onClick={() => { onChange(b.display); setQuery(b.display); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-primary/5 cursor-pointer"
            >
              <span className="text-primary-dark">{b.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ─── ADD OWNER + PET FORM ───
   ═══════════════════════════════════════════════════════ */
function AddOwnerPetModal({ open, onClose, onCreated, prefillId }: { open: boolean; onClose: () => void; onCreated: (petId: string) => void; prefillId?: string }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const [uuid, setUuid] = useState(prefillId || "");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState("");
  const [customSpecies, setCustomSpecies] = useState("");
  const [variety, setVariety] = useState("");
  const [sex, setSex] = useState("");
  const [chip, setChip] = useState("");
  const [color, setColor] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [petStatus, setPetStatus] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [createdPetId, setCreatedPetId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  // Validation helpers
  const DIGITS_ONLY = /^\d+$/;
  const LETTERS_SPACES = /^[\p{L}\s]+$/u;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const errors: Record<string, string | undefined> = {
    uuid: !uuid.trim() ? t("required") : !DIGITS_ONLY.test(uuid.trim()) || uuid.trim().length !== 11 ? t("validationIdDigits") : undefined,
    firstName: !firstName.trim() ? t("required") : !LETTERS_SPACES.test(firstName.trim()) ? t("validationNameLetters") : undefined,
    phone: !phone.trim() ? t("required") : !DIGITS_ONLY.test(phone.trim()) ? t("validationPhoneDigits") : undefined,
    email: email.trim() && !EMAIL_RE.test(email.trim()) ? t("validationEmailInvalid") : undefined,
    address: !address.trim() ? t("required") : undefined,
    petName: !petName.trim() ? t("required") : undefined,
    species: !species ? t("required") : undefined,
    customSpecies: species === "other" && !customSpecies.trim() ? t("required") : undefined,
    variety: !variety.trim() ? t("required") : undefined,
    sex: !sex ? t("required") : undefined,
    chip: chip.trim() && !DIGITS_ONLY.test(chip.trim()) ? t("validationChipDigits") : undefined,
    color: !color.trim() ? t("required") : undefined,
    birthDate: !birthDate ? t("required") : undefined,
    petStatus: !petStatus ? t("required") : undefined,
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const resetForm = () => {
    setUuid(""); setFirstName(""); setPhone(""); setEmail(""); setAddress("");
    setPetName(""); setSpecies(""); setCustomSpecies(""); setVariety(""); setSex("");
    setChip(""); setColor(""); setBirthDate(""); setPetStatus("");
    setCreatedPetId(null); setTouched({});
  };

  const isValid = !hasErrors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields as touched to show errors
    setTouched({ uuid: true, firstName: true, phone: true, email: true, address: true, petName: true, species: true, customSpecies: true, variety: true, sex: true, chip: true, color: true, birthDate: true, petStatus: true });
    if (!isValid) return;

    setSubmitting(true);
    setToast(null);

    try {
      const session = getStoredSession();
      const token = session?.accessToken;
      if (!token) throw new Error("Not authenticated");

      const resolvedSpecies = species === "other" ? customSpecies.trim() : species;

      const body: Record<string, unknown> = {
        uuid: uuid.trim(),
        first_name: firstName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        name: petName.trim(),
        pet: resolvedSpecies || undefined,
        variety: variety.trim() || undefined,
        sex: sex || undefined,
        chip: chip.trim() || undefined,
        color: color.trim() || undefined,
        date: birthDate || undefined,
      };
      if (petStatus) body.status = Number(petStatus);

      const res = await fetch(`/api/clinic/pets?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Error" }));
        throw new Error(err.message || "Failed to create pet");
      }

      const data = await res.json();
      setCreatedPetId(String(data.id));
      setToast({ type: "success", message: t("petCreated") });
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Error" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-primary-dark shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-foreground-muted/40 focus:ring-2";
  const inputOk = `${inputBase} border-border/40 focus:border-primary focus:ring-primary/20`;
  const inputErr = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-200`;
  const selectBase = "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-primary-dark shadow-[0_1px_4px_rgba(0,0,0,0.04)] outline-none transition-all focus:ring-2 cursor-pointer";
  const selectOk = `${selectBase} border-border/40 focus:border-primary focus:ring-primary/20`;
  const selectErr = `${selectBase} border-red-400 focus:border-red-500 focus:ring-red-200`;
  const reqLabel = "mb-1 flex items-center gap-1 text-sm font-semibold text-primary-dark";
  const optLabel = "mb-1 block text-xs font-semibold text-foreground-muted/70";
  const reqStar = <span className="text-red-500 text-base leading-none">*</span>;
  const fieldErr = (field: string) => touched[field] && errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]}</p> : null;
  const ic = (field: string) => touched[field] && errors[field] ? inputErr : inputOk;
  const sc = (field: string) => touched[field] && errors[field] ? selectErr : selectOk;

  // Reset form when modal opens with new prefillId
  useEffect(() => {
    if (open) {
      setUuid(prefillId || "");
      setFirstName(""); setPhone(""); setEmail(""); setAddress("");
      setPetName(""); setSpecies(""); setCustomSpecies(""); setVariety(""); setSex("");
      setChip(""); setColor(""); setBirthDate(""); setPetStatus("");
      setCreatedPetId(null); setToast(null); setTouched({});
    }
  }, [open, prefillId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 pt-[5vh]" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#f4f9ff] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
        {/* Close button */}
        <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted/40 transition-colors hover:bg-gray-100 hover:text-primary-dark cursor-pointer">
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>

        {/* Title */}
        <h2 className="mb-5 text-lg font-bold text-primary-dark">{t("addOwnerPet")}</h2>

        {/* Toast */}
        {toast && (
          <div className={`mb-5 rounded-xl p-4 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {toast.message}
            {toast.type === "success" && createdPetId && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { onCreated(createdPetId); onClose(); }}
                  className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90 cursor-pointer"
                >
                  {t("viewPet")}
                </button>
                <button
                  onClick={resetForm}
                  className="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-primary border border-primary/20 transition-colors hover:bg-primary/5 cursor-pointer"
                >
                  {t("addAnother")}
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Owner Section */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 text-sm font-bold text-primary-dark flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              {t("ownerInfoSection")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={reqLabel}>{t("personalId")} {reqStar}</label>
                <input type="text" inputMode="numeric" maxLength={11} value={uuid} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setUuid(v); }} onBlur={() => markTouched("uuid")} className={ic("uuid")} placeholder="01027061009" />
                {fieldErr("uuid")}
              </div>
              <div>
                <label className={reqLabel}>{t("name")} {reqStar}</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={() => markTouched("firstName")} className={ic("firstName")} placeholder={t("namePlaceholder")} />
                {fieldErr("firstName")}
              </div>
              <div>
                <label className={reqLabel}>{t("phone")} {reqStar}</label>
                <input type="text" inputMode="numeric" value={phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setPhone(v); }} onBlur={() => markTouched("phone")} className={ic("phone")} placeholder={t("phonePlaceholder")} />
                {fieldErr("phone")}
              </div>
              <div>
                <label className={optLabel}>{t("email")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => markTouched("email")} className={ic("email")} placeholder={t("emailPlaceholder")} />
                {fieldErr("email")}
              </div>
              <div className="sm:col-span-2">
                <label className={reqLabel}>{t("address")} {reqStar}</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} onBlur={() => markTouched("address")} className={ic("address")} placeholder={t("addressPlaceholder")} />
                {fieldErr("address")}
              </div>
            </div>
          </div>

          {/* Pet Section */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 text-sm font-bold text-primary-dark flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM3 9c-1.38 0-2.5 1.12-2.5 2.5S1.62 14 3 14s2.5-1.12 2.5-2.5S4.38 9 3 9zM17 9c-1.38 0-2.5 1.12-2.5 2.5S15.62 14 17 14s2.5-1.12 2.5-2.5S18.38 9 17 9zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>
              {t("petInfoSection")}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={reqLabel}>{t("petName")} {reqStar}</label>
                <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} onBlur={() => markTouched("petName")} className={ic("petName")} placeholder={t("petNamePlaceholder")} />
                {fieldErr("petName")}
              </div>
              <div>
                <label className={reqLabel}>{t("species")} {reqStar}</label>
                <select value={species} onChange={(e) => { setSpecies(e.target.value); setVariety(""); setCustomSpecies(""); markTouched("species"); }} onBlur={() => markTouched("species")} className={sc("species")}>
                  <option value="">{t("selectSpecies")}</option>
                  <option value="dog">{t("speciesDog")}</option>
                  <option value="cat">{t("speciesCat")}</option>
                  <option value="other">{t("speciesOther")}</option>
                </select>
                {fieldErr("species")}
              </div>
              {species === "other" && (
                <div className="sm:col-span-2">
                  <label className={reqLabel}>{t("customSpecies")} {reqStar}</label>
                  <input type="text" value={customSpecies} onChange={(e) => setCustomSpecies(e.target.value)} onBlur={() => markTouched("customSpecies")} className={ic("customSpecies")} placeholder={t("customSpeciesPlaceholder")} />
                  {fieldErr("customSpecies")}
                </div>
              )}
              <div>
                <label className={reqLabel}>{t("breed")} {reqStar}</label>
                <BreedCombobox species={species} value={variety} onChange={(v) => { setVariety(v); markTouched("variety"); }} locale={locale} className={ic("variety")} required placeholder={t("breedPlaceholder")} />
                {fieldErr("variety")}
              </div>
              <div>
                <label className={reqLabel}>{t("sex")} {reqStar}</label>
                <select value={sex} onChange={(e) => { setSex(e.target.value); markTouched("sex"); }} onBlur={() => markTouched("sex")} className={sc("sex")}>
                  <option value="">{t("selectSex")}</option>
                  <option value="male">{t("sexMale")}</option>
                  <option value="female">{t("sexFemale")}</option>
                </select>
                {fieldErr("sex")}
              </div>
              <div>
                <label className={optLabel}>{t("chipNumber")}</label>
                <input type="text" inputMode="numeric" value={chip} onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setChip(v); }} onBlur={() => markTouched("chip")} className={ic("chip")} placeholder={t("chipPlaceholder")} />
                {fieldErr("chip")}
              </div>
              <div>
                <label className={reqLabel}>{t("colorPattern")} {reqStar}</label>
                <input type="text" value={color} onChange={(e) => setColor(e.target.value)} onBlur={() => markTouched("color")} className={ic("color")} placeholder={t("colorPatternPlaceholder")} />
                {fieldErr("color")}
              </div>
              <div>
                <label className={reqLabel}>{t("birthDate")} {reqStar}</label>
                <input type="date" value={birthDate} onChange={(e) => { setBirthDate(e.target.value); markTouched("birthDate"); }} onBlur={() => markTouched("birthDate")} className={ic("birthDate")} />
                {fieldErr("birthDate")}
              </div>
              <div>
                <label className={reqLabel}>{t("petStatus")} {reqStar}</label>
                <select value={petStatus} onChange={(e) => { setPetStatus(e.target.value); markTouched("petStatus"); }} onBlur={() => markTouched("petStatus")} className={sc("petStatus")}>
                  <option value="">{t("selectStatus")}</option>
                  <option value="1">{t("statusDomestic")}</option>
                  <option value="2">{t("statusStray")}</option>
                </select>
                {fieldErr("petStatus")}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(4,114,216,0.25)] transition-all hover:bg-primary/90 hover:shadow-[0_8px_32px_rgba(4,114,216,0.35)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? t("creating") : t("save")}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ─── BACK BUTTON ───
   ═══════════════════════════════════════════════════════ */
function BackButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("dashboard");
  return (
    <button
      onClick={onClick}
      className="mb-4 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-foreground-muted/60 transition-colors hover:bg-gray-100 hover:text-primary-dark cursor-pointer"
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 011.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
      </svg>
      {t("backToHome")}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   ─── MAIN DASHBOARD PAGE ───
   ═══════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { view, setView } = useDashboardView();
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Add modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addPrefillId, setAddPrefillId] = useState<string | undefined>();

  // Pet detail modal
  const [petModalId, setPetModalId] = useState<string | null>(null);
  const [petModalOpen, setPetModalOpen] = useState(false);

  // Owner detail modal
  const [ownerModalId, setOwnerModalId] = useState<string | null>(null);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  useEffect(() => {
    setHasToken(!!getStoredSession()?.accessToken);
    setIsAdmin(getClinicInfo()?.groupId === "4");
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

  const goHome = () => setView("home");

  const openAddModal = (prefillId?: string) => {
    setAddPrefillId(prefillId);
    setAddModalOpen(true);
  };

  // Admin users see the admin dashboard
  if (hasToken && isAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <AdminDashboard />
      </div>
    );
  }

  // If no token, only show search
  if (!hasToken) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <SearchTab onViewOwner={openOwnerModal} onAdd={openAddModal} />
        <AddOwnerPetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onCreated={openPetModal} prefillId={addPrefillId} />
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
      {/* Back Button */}
      {view !== "home" && <BackButton onClick={goHome} />}

      {/* View Content */}
      {view === "home" && <SearchTab onViewOwner={openOwnerModal} onAdd={openAddModal} />}
      {view === "stats" && <StatsTab />}
      {view === "pets" && <PetsTab onViewPet={openPetModal} />}
      {view === "owners" && <OwnersTab onViewOwner={openOwnerModal} />}
      {view === "wideSearch" && <WideSearchTab onViewOwner={openOwnerModal} />}

      {/* Modals */}
      <AddOwnerPetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onCreated={openPetModal} prefillId={addPrefillId} />
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
