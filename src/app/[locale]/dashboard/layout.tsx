"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LocaleToggle } from "@/components/locale-toggle";
import { getClinicInfo, getStoredSession, clearSession } from "@/lib/utils/session";
import { DashboardViewProvider, useDashboardView } from "@/lib/context/DashboardViewContext";
import type { ViewId } from "@/lib/context/DashboardViewContext";

/* ─── Menu Dropdown (navbar version) ─── */
function NavMenuDropdown() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("clinic");
  const { view, setView } = useDashboardView();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items: { id: ViewId; label: string; icon: React.ReactNode }[] = [
    {
      id: "stats",
      label: tc("statsTab"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
    },
    {
      id: "pets",
      label: tc("petsTab"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM3 9c-1.38 0-2.5 1.12-2.5 2.5S1.62 14 3 14s2.5-1.12 2.5-2.5S4.38 9 3 9zM17 9c-1.38 0-2.5 1.12-2.5 2.5S15.62 14 17 14s2.5-1.12 2.5-2.5S18.38 9 17 9zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>,
    },
    {
      id: "owners",
      label: tc("ownersTab"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>,
    },
    {
      id: "wideSearch",
      label: t("wideSearch"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" /></svg>,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted/60 transition-all hover:bg-gray-100 hover:text-primary-dark cursor-pointer"
        aria-label={t("menu")}
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl bg-white py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-border/20">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => { setView(item.id); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                view === item.id
                  ? "bg-primary/5 text-primary font-semibold"
                  : "text-primary-dark hover:bg-gray-50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Nav Bar Content (needs context) ─── */
function NavBar() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("admin");
  const router = useRouter();
  const [clinicName, setClinicName] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const info = getClinicInfo();
    if (info?.companyName) setClinicName(info.companyName);
    setHasToken(!!getStoredSession()?.accessToken);
    setIsAdmin(info?.groupId === "4");
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/images/vetapp-logo.png"
              alt="VetApp"
              width={80}
              height={24}
              className="invert"
            />
          </Link>
          {isAdmin ? (
            <span className="hidden sm:inline-flex items-center rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600">
              {ta("title")}
            </span>
          ) : clinicName ? (
            <span className="hidden sm:inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {clinicName}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {hasToken && !isAdmin && <NavMenuDropdown />}
          <LocaleToggle />
          <button
            onClick={handleLogout}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-foreground-muted transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.97] cursor-pointer"
          >
            {t("logout")}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardViewProvider>
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-[#f4f9ff] to-[#eaf3fd]">
        <NavBar />
        <main className="flex-1">{children}</main>
      </div>
    </DashboardViewProvider>
  );
}
