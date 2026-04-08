"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

/* ─── Types ─── */
type Pet = {
  name: string;
  species: string;
  breed: string;
  sex: string;
  ageYears: number;
  ageMonths: number;
  microchip: string;
};

type Owner = {
  name: string;
  phone: string;
  personalId: string;
  email: string;
  pets: Pet[];
};

/* ─── Seed data ─── */
const SEED_DATA: Owner[] = [
  {
    name: "Dato",
    phone: "598000000",
    personalId: "000000",
    email: "",
    pets: [
      {
        name: "Chombe",
        species: "Dog",
        breed: "Mixed",
        sex: "Male",
        ageYears: 5,
        ageMonths: 0,
        microchip: "",
      },
    ],
  },
  {
    name: "David",
    phone: "598111111",
    personalId: "111111",
    email: "",
    pets: [
      {
        name: "Theo",
        species: "Dog",
        breed: "Mixed",
        sex: "Male",
        ageYears: 4,
        ageMonths: 0,
        microchip: "",
      },
    ],
  },
];

const STORAGE_KEY = "vetapp-owners";

function getOwners(): Owner[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(raw);
}

function saveOwners(owners: Owner[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(owners));
}

const blankPet: Pet = {
  name: "",
  species: "",
  breed: "",
  sex: "",
  ageYears: 0,
  ageMonths: 0,
  microchip: "",
};

/* ─── Localize species ─── */
function localizeSpecies(species: string, t: ReturnType<typeof useTranslations<"dashboard">>) {
  switch (species) {
    case "Dog": return t("speciesDog");
    case "Cat": return t("speciesCat");
    default: return species;
  }
}

/* ─── Localize breed ─── */
function localizeBreed(breed: string, t: ReturnType<typeof useTranslations<"dashboard">>) {
  switch (breed) {
    case "Mixed": return t("breedMixed");
    default: return breed;
  }
}

/* ─── Species icon helper ─── */
function speciesIcon(species: string) {
  switch (species.toLowerCase()) {
    case "dog":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .137 1.217 1.2 1.5 2.5 1.5h2M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.137 1.217-1.2 1.5-2.5 1.5h-2" />
          <path d="M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75z" />
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
    case "cat":
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c4.97 0 9-2.686 9-6v-1c0-3.314-4.03-6-9-6s-9 2.686-9 6v1c0 3.314 4.03 6 9 6z" />
          <path d="M3.5 11V4L7 7M20.5 11V4L17 7" />
          <circle cx="9" cy="14" r=".5" fill="currentColor" />
          <circle cx="15" cy="14" r=".5" fill="currentColor" />
          <path d="M11.5 16.5h1l-.5.5-.5-.5z" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.35 3C5.61 3 2.75 5.4 2.75 9.5 2.75 15 9 20.5 12 22c3-1.5 9.25-7 9.25-12.5C21.25 5.4 18.39 3 15.65 3 13.76 3 12.55 4.14 12 5 11.45 4.14 10.24 3 8.35 3z" />
        </svg>
      );
  }
}

/* ─── Modal ─── */
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-primary-dark/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-0 shadow-[0_24px_64px_rgba(0,0,0,0.12)] animate-modal-in">
        {children}
      </div>
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-toast-in">
      <div className="flex items-center gap-2 rounded-xl bg-primary-dark px-5 py-3 text-sm font-medium text-white shadow-xl">
        <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {message}
      </div>
    </div>
  );
}

/* ─── Input style constant ─── */
const inputCls = "w-full rounded-xl border border-border/40 bg-surface/10 px-4 py-2.5 text-sm text-primary-dark outline-none transition-all placeholder:text-foreground-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20";
const selectCls = `${inputCls} appearance-none cursor-pointer`;
const labelCls = "mb-1.5 block text-sm font-medium text-primary-dark";

/* ─── Pet Form Fields ─── */
function PetFormFields({
  pet,
  onChange,
  t,
}: {
  pet: Pet;
  onChange: (p: Pet) => void;
  t: ReturnType<typeof useTranslations<"dashboard">>;
}) {
  const yearsOptions = Array.from({ length: 21 }, (_, i) => i); // 0-20
  const monthsOptions = Array.from({ length: 12 }, (_, i) => i); // 0-11
  const showCustomSpecies = pet.species === "__other__";

  return (
    <div className="space-y-4">
      {/* Pet Name */}
      <div>
        <label className={labelCls}>{t("petName")}</label>
        <input
          type="text"
          value={pet.name}
          onChange={(e) => onChange({ ...pet, name: e.target.value })}
          placeholder={t("petNamePlaceholder")}
          className={inputCls}
        />
      </div>

      {/* Species + Breed */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t("species")}</label>
          <select
            value={showCustomSpecies ? "__other__" : pet.species}
            onChange={(e) => {
              const v = e.target.value;
              onChange({ ...pet, species: v === "__other__" ? "__other__" : v });
            }}
            className={selectCls}
          >
            <option value="">{t("selectSpecies")}</option>
            <option value="Dog">{t("speciesDog")}</option>
            <option value="Cat">{t("speciesCat")}</option>
            <option value="__other__">{t("speciesOther")}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("breed")}</label>
          <input
            type="text"
            value={pet.breed}
            onChange={(e) => onChange({ ...pet, breed: e.target.value })}
            placeholder={t("breedPlaceholder")}
            className={inputCls}
          />
        </div>
      </div>

      {/* Custom species */}
      {showCustomSpecies && (
        <input
          type="text"
          placeholder={t("customSpecies")}
          className={inputCls}
          onChange={(e) => onChange({ ...pet, species: e.target.value || "__other__" })}
          autoFocus
        />
      )}

      {/* Sex + Age Years + Age Months */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>{t("sex")}</label>
          <select
            value={pet.sex}
            onChange={(e) => onChange({ ...pet, sex: e.target.value })}
            className={selectCls}
          >
            <option value="">{t("selectSex")}</option>
            <option value="Male">{t("sexMale")}</option>
            <option value="Female">{t("sexFemale")}</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("ageYears")}</label>
          <select
            value={pet.ageYears}
            onChange={(e) => onChange({ ...pet, ageYears: Number(e.target.value) })}
            className={selectCls}
          >
            <option value={0}>{t("selectYears")}</option>
            {yearsOptions.filter(n => n > 0).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? t("nYears", { n }) : t("nYearsPlural", { n })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>{t("ageMonths")}</label>
          <select
            value={pet.ageMonths}
            onChange={(e) => onChange({ ...pet, ageMonths: Number(e.target.value) })}
            className={selectCls}
          >
            <option value={0}>{t("selectMonths")}</option>
            {monthsOptions.filter(n => n > 0).map((n) => (
              <option key={n} value={n}>
                {n === 1 ? t("nMonths", { n }) : t("nMonthsPlural", { n })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Microchip */}
      <div>
        <label className={labelCls}>{t("microchip")}</label>
        <input
          type="text"
          value={pet.microchip}
          onChange={(e) => onChange({ ...pet, microchip: e.target.value })}
          placeholder={t("microchipPlaceholder")}
          className={inputCls}
        />
      </div>
    </div>
  );
}

/* ─── Owner Info Fields (for Add Pet modal) ─── */
function OwnerInfoFields({
  owner,
  onChange,
  t,
  readOnly = false,
}: {
  owner: { name: string; personalId: string; phone: string; email: string };
  onChange: (o: { name: string; personalId: string; phone: string; email: string }) => void;
  t: ReturnType<typeof useTranslations<"dashboard">>;
  readOnly?: boolean;
}) {
  const cls = readOnly
    ? "w-full rounded-xl border border-border/20 bg-surface/20 px-4 py-2.5 text-sm text-primary-dark outline-none cursor-default"
    : inputCls;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t("name")}</label>
          <input type="text" value={owner.name} readOnly={readOnly} onChange={(e) => onChange({ ...owner, name: e.target.value })} placeholder={t("namePlaceholder")} className={cls} />
        </div>
        <div>
          <label className={labelCls}>{t("personalId")}</label>
          <input type="text" value={owner.personalId} readOnly={readOnly} onChange={(e) => onChange({ ...owner, personalId: e.target.value })} placeholder="000000" className={cls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>{t("phone")}</label>
          <input type="text" value={owner.phone} readOnly={readOnly} onChange={(e) => onChange({ ...owner, phone: e.target.value })} placeholder={t("phonePlaceholder")} className={cls} />
        </div>
        <div>
          <label className={labelCls}>{t("email")}</label>
          <input type="text" value={owner.email} readOnly={readOnly} onChange={(e) => onChange({ ...owner, email: e.target.value })} placeholder={t("emailPlaceholder")} className={cls} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ─── MAIN DASHBOARD PAGE ───
   ═══════════════════════════════════════════════ */
export default function DashboardPage() {
  const t = useTranslations("dashboard");

  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [foundOwner, setFoundOwner] = useState<Owner | null>(null);
  const [toast, setToast] = useState("");

  const [showAddPet, setShowAddPet] = useState(false);
  const [showCreateOwner, setShowCreateOwner] = useState(false);

  const [newPet, setNewPet] = useState<Pet>({ ...blankPet });

  const [newOwner, setNewOwner] = useState({
    name: "",
    phone: "",
    personalId: "",
    email: "",
  });
  const [firstPet, setFirstPet] = useState<Pet>({ ...blankPet });

  // For editing owner info in Add Pet modal
  const [addPetOwner, setAddPetOwner] = useState({ name: "", personalId: "", phone: "", email: "" });

  useEffect(() => { getOwners(); }, []);

  const doSearch = useCallback(() => {
    if (!query.trim()) return;
    const owners = getOwners();
    const match = owners.find((o) => o.personalId === query.trim());
    setFoundOwner(match ?? null);
    setSearched(true);
  }, [query]);

  /* ─── Add pet (works with or without prior search) ─── */
  const handleAddPet = () => {
    if (!newPet.name.trim() || !addPetOwner.personalId.trim() || !addPetOwner.name.trim()) return;
    const owners = getOwners();
    const cleanPet = { ...newPet, species: newPet.species === "__other__" ? "" : newPet.species };
    const idx = owners.findIndex((o) => o.personalId === addPetOwner.personalId);

    if (idx !== -1) {
      // Existing owner — add pet & update info
      owners[idx].pets.push(cleanPet);
      owners[idx].name = addPetOwner.name;
      owners[idx].phone = addPetOwner.phone;
      owners[idx].email = addPetOwner.email;
      saveOwners(owners);
      setFoundOwner({ ...owners[idx] });
    } else {
      // New owner — create with this pet
      const owner: Owner = {
        name: addPetOwner.name,
        personalId: addPetOwner.personalId,
        phone: addPetOwner.phone,
        email: addPetOwner.email,
        pets: [cleanPet],
      };
      owners.push(owner);
      saveOwners(owners);
      setFoundOwner(owner);
    }
    setSearched(true);
    setQuery(addPetOwner.personalId);
    setNewPet({ ...blankPet });
    setShowAddPet(false);
    setToast(t("petAdded"));
  };

  /* ─── Create owner ─── */
  const handleCreateOwner = () => {
    if (!newOwner.name.trim() || !newOwner.personalId.trim()) return;
    const owners = getOwners();
    const cleanPet = { ...firstPet, species: firstPet.species === "__other__" ? "" : firstPet.species };
    const owner: Owner = {
      ...newOwner,
      personalId: newOwner.personalId || query.trim(),
      pets: firstPet.name.trim() ? [cleanPet] : [],
    };
    owners.push(owner);
    saveOwners(owners);
    setFoundOwner(owner);
    setSearched(true);
    setQuery(owner.personalId);
    setShowCreateOwner(false);
    setNewOwner({ name: "", phone: "", personalId: "", email: "" });
    setFirstPet({ ...blankPet });
    setToast(t("ownerCreated"));
  };

  const openCreateOwner = () => {
    setNewOwner((prev) => ({ ...prev, personalId: query.trim() }));
    setShowCreateOwner(true);
  };

  const openAddPet = (prefillOwner?: Owner | null) => {
    setNewPet({ ...blankPet });
    if (prefillOwner) {
      setAddPetOwner({
        name: prefillOwner.name,
        personalId: prefillOwner.personalId,
        phone: prefillOwner.phone,
        email: prefillOwner.email,
      });
    } else {
      setAddPetOwner({ name: "", personalId: "", phone: "", email: "" });
    }
    setShowAddPet(true);
  };

  /* ─── Format age display ─── */
  function formatAge(pet: Pet): string {
    const parts: string[] = [];
    if (pet.ageYears > 0) {
      parts.push(pet.ageYears === 1 ? t("nYears", { n: pet.ageYears }) : t("nYearsPlural", { n: pet.ageYears }));
    }
    if (pet.ageMonths > 0) {
      parts.push(pet.ageMonths === 1 ? t("nMonths", { n: pet.ageMonths }) : t("nMonthsPlural", { n: pet.ageMonths }));
    }
    return parts.join(" ");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* ─── SEARCH HERO ─── */}
      <div className={`transition-all duration-500 ${searched ? "mb-8" : "mb-0 pt-[12vh]"}`}>
        <div className={`text-center transition-all duration-500 ${searched ? "mb-5" : "mb-8"}`}>
          <h1 className={`font-extrabold tracking-tight text-primary-dark transition-all duration-500 ${searched ? "text-2xl" : "text-3xl sm:text-4xl"}`}>
            {t("searchTitle")}
          </h1>
          {!searched && (
            <p className="mt-2 text-sm text-foreground-muted/60">{t("searchDesc")}</p>
          )}
        </div>
        <div className="mx-auto max-w-xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-foreground-muted/40" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && doSearch()}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-2xl border border-border/40 bg-white pl-11 pr-4 py-3.5 text-sm text-primary-dark shadow-[0_2px_12px_rgba(0,0,0,0.04)] outline-none transition-all placeholder:text-foreground-muted/40 focus:border-primary focus:shadow-[0_4px_24px_rgba(4,114,216,0.12)] focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={doSearch}
              className="rounded-2xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(4,114,216,0.25)] transition-all hover:bg-primary/90 hover:shadow-[0_8px_32px_rgba(4,114,216,0.35)] active:scale-[0.97] cursor-pointer"
            >
              {t("search")}
            </button>
            <button
              onClick={() => openAddPet(foundOwner)}
              title={t("addPet")}
              className="flex items-center justify-center rounded-2xl border-2 border-primary/20 bg-white px-3.5 py-3.5 text-primary transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-[0.97] cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── RESULTS ─── */}
      {searched && foundOwner && (
        <div className="animate-results-in space-y-6">
          {/* Owner Card */}
          <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary-dark">{t("ownerInfo")}</h2>
              <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                ID: {foundOwner.personalId}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted/50">{t("name")}</p>
                <p className="mt-0.5 text-sm font-semibold text-primary-dark">{foundOwner.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted/50">{t("phone")}</p>
                <p className="mt-0.5 text-sm font-semibold text-primary-dark">{foundOwner.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted/50">{t("email")}</p>
                <p className="mt-0.5 text-sm font-semibold text-primary-dark">{foundOwner.email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Pets Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary-dark">
                {t("pets")}
                <span className="ml-2 text-sm font-normal text-foreground-muted/50">({foundOwner.pets.length})</span>
              </h2>
              <button
                onClick={() => openAddPet(foundOwner)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-[0_4px_16px_rgba(4,114,216,0.3)] active:scale-[0.97] cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                </svg>
                {t("addPet")}
              </button>
            </div>

            {foundOwner.pets.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border/30 bg-white/50 py-12 text-center">
                <p className="text-sm text-foreground-muted/50">{t("noPets")}</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {foundOwner.pets.map((pet, i) => {
                  const ageStr = formatAge(pet);
                  return (
                    <div key={i} className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                          {speciesIcon(pet.species)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-primary-dark">{pet.name}</p>
                          <p className="text-xs text-foreground-muted/50">
                            {localizeSpecies(pet.species, t)}
                            {pet.breed ? ` · ${localizeBreed(pet.breed, t)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pet.sex && (
                          <span className="rounded-lg bg-surface/40 px-2.5 py-1 text-xs font-medium text-foreground-muted">
                            {pet.sex === "Male" ? t("sexMale") : t("sexFemale")}
                          </span>
                        )}
                        {ageStr && (
                          <span className="rounded-lg bg-surface/40 px-2.5 py-1 text-xs font-medium text-foreground-muted">
                            {ageStr}
                          </span>
                        )}
                        {pet.microchip && (
                          <span className="rounded-lg bg-surface/40 px-2.5 py-1 text-xs font-medium text-foreground-muted">
                            {pet.microchip}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── NOT FOUND ─── */}
      {searched && !foundOwner && (
        <div className="animate-results-in mx-auto max-w-md text-center">
          <div className="rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-400">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-primary-dark">{t("notFound")}</h3>
            <p className="mt-1.5 text-sm text-foreground-muted/60">{t("notFoundDesc")}</p>
            <button
              onClick={openCreateOwner}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-[0_8px_32px_rgba(4,114,216,0.35)] active:scale-[0.97] cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
              </svg>
              {t("createOwner")}
            </button>
          </div>
        </div>
      )}

      {/* ─── ADD PET MODAL (with owner info) ─── */}
      <Modal open={showAddPet} onClose={() => setShowAddPet(false)}>
        <div className="border-b border-gray-100 px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold text-primary-dark">{t("addPet")}</h3>
        </div>
        <div className="space-y-5 px-6 py-5">
          {/* Owner info section */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{t("ownerDetails")}</h4>
            <OwnerInfoFields owner={addPetOwner} onChange={setAddPetOwner} t={t} />
          </div>
          {/* Pet fields */}
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{t("petDetails")}</h4>
            <PetFormFields pet={newPet} onChange={setNewPet} t={t} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={() => setShowAddPet(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-gray-50 cursor-pointer">
            {t("cancel")}
          </button>
          <button onClick={handleAddPet} disabled={!newPet.name.trim() || !addPetOwner.name.trim() || !addPetOwner.personalId.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer">
            {t("save")}
          </button>
        </div>
      </Modal>

      {/* ─── CREATE OWNER MODAL ─── */}
      <Modal open={showCreateOwner} onClose={() => setShowCreateOwner(false)}>
        <div className="border-b border-gray-100 px-6 pt-6 pb-4">
          <h3 className="text-lg font-bold text-primary-dark">{t("newOwnerTitle")}</h3>
          <p className="mt-0.5 text-sm text-foreground-muted/60">{t("newOwnerDesc")}</p>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{t("ownerDetails")}</h4>
            <OwnerInfoFields owner={newOwner} onChange={setNewOwner} t={t} />
          </div>
          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary">{t("petDetails")}</h4>
            <PetFormFields pet={firstPet} onChange={setFirstPet} t={t} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={() => setShowCreateOwner(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:bg-gray-50 cursor-pointer">
            {t("cancel")}
          </button>
          <button onClick={handleCreateOwner} disabled={!newOwner.name.trim() || !newOwner.personalId.trim()} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer">
            {t("save")}
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast} onDone={() => setToast("")} />}
    </div>
  );
}
