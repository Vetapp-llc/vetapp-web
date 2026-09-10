"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { useEffect, useRef, useState } from "react";

type Locale = (typeof routing.locales)[number];

const LOCALES: { code: Locale; short: string; label: string }[] = [
  { code: "ka", short: "GE", label: "ქართული" },
  { code: "en", short: "EN", label: "English" },
  { code: "ru", short: "RU", label: "Русский" },
];

const STORAGE_KEY = "vetapp-locale";

const isLocale = (v: string): v is Locale =>
  (routing.locales as readonly string[]).includes(v);

export function LocaleToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // On mount, restore saved preference and redirect if it differs
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== locale && isLocale(saved)) {
      router.replace(pathname, { locale: saved });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    localStorage.setItem(STORAGE_KEY, next);
    router.replace(pathname, { locale: next });
  };

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 px-3 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer"
      >
        {current.short}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === locale}
                onClick={() => select(l.code)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 cursor-pointer ${
                  l.code === locale
                    ? "font-semibold text-primary"
                    : "text-gray-600"
                }`}
              >
                {l.label}
                <span className="text-[10px] font-bold text-gray-400">
                  {l.short}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
