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
  const tm = useTranslations("menu");
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
      id: "appointments",
      label: tm("appointments"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>,
    },
    {
      id: "shop",
      label: tm("shop"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>,
    },
    {
      id: "prices",
      label: tm("prices"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>,
    },
    {
      id: "staff",
      label: tm("staff"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>,
    },
    {
      id: "promo",
      label: tm("promo"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" /><path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" /></svg>,
    },
    {
      id: "account",
      label: tm("account"),
      icon: <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>,
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
          {items.map((item: { id: ViewId; label: string; icon: React.ReactNode }) => (
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
