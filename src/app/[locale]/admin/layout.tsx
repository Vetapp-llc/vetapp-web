"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LocaleToggle } from "@/components/locale-toggle";
import { getStoredSession, getClinicInfo, clearSession } from "@/lib/utils/session";

function AdminNavBar() {
  const t = useTranslations("dashboard");
  const ta = useTranslations("admin");
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/images/vetapp-logo.png"
              alt="VetApp"
              width={80}
              height={24}
              className="invert"
            />
          </Link>
          <span className="hidden sm:inline-flex items-center rounded-lg bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600">
            {ta("title")}
          </span>
        </div>

        <div className="flex items-center gap-3">
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    const info = getClinicInfo();
    if (!session?.accessToken || info?.groupId !== "4") {
      router.push("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-[#f4f9ff] to-[#eaf3fd]">
      <AdminNavBar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
