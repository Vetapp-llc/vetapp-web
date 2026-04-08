"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";

export function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // On mount, check localStorage for saved preference and redirect if needed
  useEffect(() => {
    const saved = localStorage.getItem("vetapp-locale");
    if (saved && saved !== locale && (saved === "en" || saved === "ka")) {
      router.replace(pathname, { locale: saved });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const next = locale === "en" ? "ka" : "en";
    localStorage.setItem("vetapp-locale", next);
    router.replace(pathname, { locale: next });
  };

  return (
    <button
      onClick={toggle}
      className="relative flex h-8 w-[72px] items-center rounded-full border border-gray-200 bg-gray-100 transition-colors hover:bg-gray-150 cursor-pointer"
      aria-label="Toggle language"
    >
      <span
        className="absolute top-0.5 h-7 w-9 rounded-full bg-primary transition-transform duration-200"
        style={{
          transform: locale === "en" ? "translateX(2px)" : "translateX(33px)",
        }}
      />
      <span
        className={`relative z-10 flex-1 text-center text-xs font-bold transition-colors ${
          locale === "en" ? "text-white" : "text-gray-400"
        }`}
      >
        EN
      </span>
      <span
        className={`relative z-10 flex-1 text-center text-xs font-bold transition-colors ${
          locale === "ka" ? "text-white" : "text-gray-400"
        }`}
      >
        GE
      </span>
    </button>
  );
}
