import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleToggle } from "@/components/locale-toggle";

const APP_STORE_URL = "https://apps.apple.com/no/app/vetapp/id6444080057";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="min-h-screen antialiased overflow-x-hidden">
      {/* ─── NAV ─── */}
      <nav className="relative z-30 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Image
            src="/images/vetapp-logo.png"
            alt="VetApp"
            width={100}
            height={30}
            className="invert"
          />
          <div className="flex items-center gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:block text-xs text-gray-400 hover:text-primary transition-colors"
            >
              {t("iosApp")} ↗
            </a>
            <LocaleToggle />
            <Link
              href="/login"
              className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.97]"
            >
              {t("logIn")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO: text left, image right ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#f4f9ff] to-[#eaf3fd]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "url(/images/paw.png)",
            backgroundSize: "120px 120px",
          }}
        />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 pt-14 pb-20 lg:flex-row lg:gap-16 lg:pt-20 lg:pb-0">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-primary-dark sm:text-5xl lg:text-[3.5rem]">
              {t("heroTitle1")}
              <br />
              <span className="text-primary italic">{t("heroTitle2")}</span>
              <br />
              {t("heroTitle3")}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground-muted/70">
              {t("heroDesc")}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white transition-all hover:shadow-[0_8px_40px_rgba(4,114,216,0.35)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("getStarted")}
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <Image
              src="/images/landing-img1.avif"
              alt="VetApp platform"
              width={520}
              height={580}
              className="relative rounded-t-2xl lg:rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)]"
              priority
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURE 1: PATIENT RECORDS — centered wide image ─── */}
      <section className="bg-gradient-to-b from-[#eaf3fd] to-white px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary">
              {t("patientRecords")}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-primary-dark md:text-4xl lg:text-[2.75rem]">
              {t("patientRecordsTitle1")} {t("patientRecordsTitle2")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-foreground-muted/65">
              {t("patientRecordsDesc")}
            </p>
          </div>
          <div className="mt-14 flex justify-center">
            <Image
              src="/images/landing-img1.avif"
              alt={t("patientRecords")}
              width={720}
              height={480}
              className="rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.07)]"
            />
          </div>
        </div>
      </section>

      {/* ─── FEATURE 2: SCHEDULING — image left, text right ─── */}
      <section className="bg-white px-6 py-20 lg:py-28">
        <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-12 lg:flex-row lg:gap-20">
          <div className="flex flex-1 justify-center">
            <Image
              src="/images/landing-img2.avif"
              alt={t("scheduling")}
              width={480}
              height={420}
              className="rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.07)]"
            />
          </div>
          <div className="flex-1 text-center lg:text-left">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary">
              {t("scheduling")}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-primary-dark md:text-4xl">
              {t("schedulingTitle1")}
              <br />
              {t("schedulingTitle2")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-foreground-muted/65">
              {t("schedulingDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* ─── FEATURE 3: VACCINATION — text left, image right ─── */}
      <section className="bg-gradient-to-b from-white to-[#f4f9ff] px-6 py-20 lg:py-28">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 lg:flex-row lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary">
              {t("vaccination")}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-primary-dark md:text-4xl">
              {t("vaccinationTitle1")}
              <br />
              {t("vaccinationTitle2")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-foreground-muted/65">
              {t("vaccinationDesc")}
            </p>
          </div>
          <div className="flex flex-1 justify-center">
            <Image
              src="/images/landing-img3.avif"
              alt={t("vaccination")}
              width={480}
              height={420}
              className="rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.07)]"
            />
          </div>
        </div>
      </section>

      {/* ─── CLIENT APP — centered with phone screenshots ─── */}
      <section className="bg-gradient-to-b from-[#f4f9ff] to-white px-6 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.15em] text-primary">
              {t("clientApp")}
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-primary-dark md:text-4xl lg:text-[2.75rem]">
              {t("clientAppTitle1")} {t("clientAppTitle2")}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-foreground-muted/65">
              {t("clientAppDesc")}
            </p>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              {t("appStore")}
            </a>
          </div>
          <div className="mt-14 flex items-end justify-center gap-5">
            <Image
              src="/images/ios-img-1.png"
              alt="VetApp welcome screen"
              width={180}
              height={360}
              className="rounded-2xl shadow-lg animate-float-up"
            />
            <Image
              src="/images/ios-img-2.png"
              alt="VetApp services"
              width={180}
              height={360}
              className="rounded-2xl shadow-lg animate-float-down"
            />
            <Image
              src="/images/ios-img-3.png"
              alt="VetApp vaccines"
              width={180}
              height={360}
              className="hidden sm:block rounded-2xl shadow-lg animate-float-up"
              style={{ animationDelay: "0.5s" }}
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-[#0a2a4a] px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            {t("ctaTitle1")} <span className="italic">{t("ctaTitle2")}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
            {t("ctaDesc")}
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-primary-dark shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("getStarted")}
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0a2a4a] py-4 px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} VetApp
          </p>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            {t("downloadIos")} ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
