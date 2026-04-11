"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminStats, useClinicStatsForAdmin } from "@/lib/hooks/useAdminData";
import { DailyRevenueSection } from "@/components/dashboard/DailyRevenueSection";
import {
  SPECIES_COLORS,
  fmtNum,
  LoadingSkeleton,
  SummaryCard,
  DonutChart,
  HorizontalBarChart,
  Section,
} from "@/components/dashboard/shared";

/* ─── Clinic Drill-down View ─── */
function ClinicDrillDown({
  clinicCode,
  clinicName,
  onBack,
}: {
  clinicCode: string;
  clinicName: string;
  onBack: () => void;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("clinic");
  const { data: stats, isLoading } = useClinicStatsForAdmin(clinicCode);

  return (
    <div className="space-y-5 animate-results-in">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {t("backToOverview")}
      </button>

      <h2 className="text-lg font-bold text-primary-dark">
        {t("clinicStats")} — {clinicName || clinicCode}
      </h2>

      <DailyRevenueSection clinic={clinicCode} />

      {isLoading || !stats ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label={tc("totalPets")}
              value={fmtNum(stats.totalPets)}
              accent="#0472D8"
              icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM3 9c-1.38 0-2.5 1.12-2.5 2.5S1.62 14 3 14s2.5-1.12 2.5-2.5S4.38 9 3 9zM17 9c-1.38 0-2.5 1.12-2.5 2.5S15.62 14 17 14s2.5-1.12 2.5-2.5S18.38 9 17 9zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>}
            />
            <SummaryCard
              label={tc("totalOwners")}
              value={fmtNum(stats.totalOwners)}
              accent="#1A9A6B"
              icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
            />
            <SummaryCard
              label={tc("totalRecords")}
              value={fmtNum(stats.totalRecords)}
              accent="#E8913A"
              icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Section title={tc("speciesBreakdown")}>
              <DonutChart
                data={stats.speciesBreakdown.map((s) => ({
                  label: s.species || "—",
                  value: s.count,
                }))}
                colors={SPECIES_COLORS}
              />
            </Section>
            <Section title={tc("sexDistribution")}>
              <HorizontalBarChart
                data={stats.sexDistribution.map((s) => ({
                  label: s.sex || "—",
                  value: s.count,
                }))}
                color="#1A9A6B"
              />
            </Section>
          </div>

          <Section title={tc("topBreeds")}>
            <HorizontalBarChart
              data={stats.topBreeds.map((b) => ({
                label: b.breed,
                value: b.count,
              }))}
            />
          </Section>

          <Section title={tc("topProcedures")}>
            {stats.topProcedures.length > 0 ? (
              <HorizontalBarChart
                data={stats.topProcedures.map((p) => ({
                  label: p.name || p.type || "—",
                  value: p.count,
                }))}
                color="#9B59B6"
              />
            ) : (
              <p className="text-sm text-foreground-muted/50 py-4 text-center">{tc("noStats")}</p>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

/* ─── System Overview ─── */
function SystemOverview({
  onSelectClinic,
}: {
  onSelectClinic: (code: string, name: string) => void;
}) {
  const t = useTranslations("admin");
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading || !stats) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-5 animate-results-in">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label={t("totalClinics")}
          value={fmtNum(stats.pets_per_clinic?.length ?? 0)}
          accent="#0472D8"
          icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" /></svg>}
        />
        <SummaryCard
          label={t("totalVets")}
          value={fmtNum(stats.total_vets)}
          accent="#1A9A6B"
          icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>}
        />
        <SummaryCard
          label={t("totalPets")}
          value={fmtNum(stats.total_pets)}
          accent="#E8913A"
          icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM3 9c-1.38 0-2.5 1.12-2.5 2.5S1.62 14 3 14s2.5-1.12 2.5-2.5S4.38 9 3 9zM17 9c-1.38 0-2.5 1.12-2.5 2.5S15.62 14 17 14s2.5-1.12 2.5-2.5S18.38 9 17 9zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>}
        />
        <SummaryCard
          label={t("totalOwners")}
          value={fmtNum(stats.total_owners)}
          accent="#9B59B6"
          icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label={t("dogs")}
          value={fmtNum(stats.total_dogs)}
          accent="#0472D8"
          icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>}
        />
        <SummaryCard
          label={t("cats")}
          value={fmtNum(stats.total_cats)}
          accent="#E8913A"
          icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>}
        />
        <SummaryCard
          label={t("other")}
          value={fmtNum(stats.total_other)}
          accent="#1A9A6B"
          icon={<svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" /></svg>}
        />
      </div>

      <Section title={t("clinics")}>
        {stats.pets_per_clinic && stats.pets_per_clinic.length > 0 ? (
          <div className="space-y-1">
            {stats.pets_per_clinic.map((c) => (
              <button
                key={c.clinic}
                onClick={() => onSelectClinic(c.clinic, c.company_name ?? "")}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-medium text-primary-dark truncate">
                      {c.company_name || c.clinic}
                    </p>
                    {c.company_name && (
                      <p className="text-xs text-foreground-muted/50">{c.clinic}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-primary-dark tabular-nums">
                    {fmtNum(c.count)} {t("totalPets").toLowerCase()}
                  </span>
                  <svg className="h-4 w-4 text-foreground-muted/30" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted/50 py-4 text-center">No clinics found</p>
        )}
      </Section>

      {stats.payment_tiers && stats.payment_tiers.length > 0 && (
        <Section title={t("paymentTiers")}>
          <HorizontalBarChart
            data={stats.payment_tiers.map((tier) => ({
              label: `${tier.price} ₾`,
              value: tier.count,
            }))}
            color="#9B59B6"
          />
        </Section>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ─── ADMIN DASHBOARD ───
   ═══════════════════════════════════════════ */
export function AdminDashboard() {
  const [selectedClinic, setSelectedClinic] = useState<{
    code: string;
    name: string;
  } | null>(null);

  return selectedClinic ? (
    <ClinicDrillDown
      clinicCode={selectedClinic.code}
      clinicName={selectedClinic.name}
      onBack={() => setSelectedClinic(null)}
    />
  ) : (
    <SystemOverview
      onSelectClinic={(code, name) => setSelectedClinic({ code, name })}
    />
  );
}
