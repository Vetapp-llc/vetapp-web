"use client";

import { useActionState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

type LoginState = { error: string; success: boolean };

export default function LoginPage() {
  const t = useTranslations("login");
  const router = useRouter();

  async function loginAction(
    _prev: LoginState,
    formData: FormData,
  ): Promise<LoginState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          error: res.status === 401 ? t("errorInvalid") : t("errorGeneric"),
          success: false,
        };
      }

      localStorage.setItem("access_token", data.access_token);
      if (data.refreshToken) {
        localStorage.setItem("refresh_token", data.refreshToken);
      }

      // Store full session for clinic data browsing
      localStorage.setItem(
        "vetapp-session",
        JSON.stringify({
          accessToken: data.access_token,
          refreshToken: data.refreshToken,
          user: data.user,
          clinic: data.clinic ?? null,
        }),
      );

      return { error: "", success: true };
    } catch {
      return { error: t("errorGeneric"), success: false };
    }
  }

  const [state, action, pending] = useActionState(loginAction, {
    error: "",
    success: false,
  });

  useEffect(() => {
    if (state.success) {
      router.push("/dashboard");
    }
  }, [state.success, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white via-[#f4f9ff] to-[#eaf3fd] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <Image
              src="/images/vetapp-logo.png"
              alt="VetApp"
              width={120}
              height={36}
              className="invert"
            />
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 py-10 shadow-[0_16px_48px_rgba(0,0,0,0.07)]">
          <h1 className="text-2xl font-bold tracking-tight text-primary-dark">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted/60">
            {t("subtitle")}
          </p>

          <form action={action} className="mt-8 space-y-5">
            {/* Email / Username */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-primary-dark"
              >
                {t("email")}
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                autoComplete="username"
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-xl border border-border/40 bg-surface/20 px-4 py-3 text-sm text-primary-dark outline-none transition-colors placeholder:text-foreground-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-primary-dark"
              >
                {t("password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={t("passwordPlaceholder")}
                className="w-full rounded-xl border border-border/40 bg-surface/20 px-4 py-3 text-sm text-primary-dark outline-none transition-colors placeholder:text-foreground-muted/40 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Error */}
            {state.error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {state.error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-primary/90 hover:shadow-[0_8px_40px_rgba(4,114,216,0.35)] active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {pending ? t("submitting") : t("submit")}
            </button>
          </form>
        </div>

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-foreground-muted/50 transition-colors hover:text-primary"
          >
            ← {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
