"use client";

import { useTranslations } from "next-intl";
import { useClinicStats } from "@/lib/hooks/useClinicData";
import { DailyRevenueSection } from "./DailyRevenueSection";
import {
  SPECIES_COLORS,
  CHART_BLUE,
  fmtNum,
  pct,
  LoadingSkeleton,
  SummaryCard,
  DonutChart,
  HorizontalBarChart,
  Section,
} from "./shared";

/* ═══════════════════════════════════════════
   ─── MAIN STATS TAB ───
   ═══════════════════════════════════════════ */
export function StatsTab() {
  const t = useTranslations("clinic");
  const { data: stats, isLoading } = useClinicStats();

  if (isLoading || !stats) {
    return <LoadingSkeleton />;
  }

  const trends = stats.monthlyTrends;
  const maxRecords = Math.max(...trends.map((m) => m.records), 1);

  return (
    <div className="space-y-5 animate-results-in">
      {/* ── Daily Revenue ── */}
      <DailyRevenueSection />

      {/* ── Row 1: Summary Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label={t("totalPets")}
          value={fmtNum(stats.totalPets)}
          accent="#0472D8"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM3 9c-1.38 0-2.5 1.12-2.5 2.5S1.62 14 3 14s2.5-1.12 2.5-2.5S4.38 9 3 9zM17 9c-1.38 0-2.5 1.12-2.5 2.5S15.62 14 17 14s2.5-1.12 2.5-2.5S18.38 9 17 9zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" />
            </svg>
          }
        />
        <SummaryCard
          label={t("totalOwners")}
          value={fmtNum(stats.totalOwners)}
          accent="#1A9A6B"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          }
        />
        <SummaryCard
          label={t("totalRecords")}
          value={fmtNum(stats.totalRecords)}
          accent="#E8913A"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      {/* ── Row 2: Species + Sex Distribution ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <Section title={t("speciesBreakdown")}>
          <DonutChart
            data={stats.speciesBreakdown.map((s) => ({
              label: s.species || "—",
              value: s.count,
            }))}
            colors={SPECIES_COLORS}
          />
        </Section>

        <Section title={t("sexDistribution")}>
          <HorizontalBarChart
            data={stats.sexDistribution.map((s) => ({
              label: s.sex || "—",
              value: s.count,
            }))}
            color="#1A9A6B"
          />
        </Section>
      </div>

      {/* ── Row 3: Top Breeds ── */}
      <Section title={t("topBreeds")}>
        <HorizontalBarChart
          data={stats.topBreeds.map((b) => ({
            label: b.breed,
            value: b.count,
          }))}
        />
      </Section>

      {/* ── Row 4: Monthly Trends ── */}
      <Section title={t("monthlyTrends")}>
        {trends.length > 0 ? (
          <div className="space-y-2">
            {trends.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-medium text-foreground-muted/60 text-right tabular-nums">
                  {m.month}
                </span>
                <div className="flex-1 h-5 rounded-full bg-surface/40 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct(m.records, maxRecords)}%`,
                      backgroundColor: CHART_BLUE,
                      minWidth: m.records > 0 ? "4px" : 0,
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-xs font-bold text-primary-dark text-right tabular-nums">
                  {fmtNum(m.records)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted/50 py-4 text-center">{t("noStats")}</p>
        )}
      </Section>

      {/* ── Row 5: Procedures + Vaccines ── */}
      <div className="grid gap-5 md:grid-cols-2">
        <Section title={t("topProcedures")}>
          {stats.topProcedures.length > 0 ? (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-foreground-muted/40 uppercase tracking-wider">
                    <th className="pb-2 px-2 font-semibold">{t("topProcedures")}</th>
                    <th className="pb-2 px-2 font-semibold text-right">{t("count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topProcedures.map((p) => (
                    <tr
                      key={`${p.type}-${p.name}`}
                      className="border-t border-surface/30"
                    >
                      <td className="py-2 px-2 text-primary-dark font-medium truncate max-w-[160px]">
                        {p.name || p.type || "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-primary-dark tabular-nums">
                        {fmtNum(p.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-foreground-muted/50 py-4 text-center">{t("noStats")}</p>
          )}
        </Section>

        <Section title={t("topVaccines")}>
          {stats.topVaccines.length > 0 ? (
            <HorizontalBarChart
              data={stats.topVaccines.map((v) => ({
                label: v.name,
                value: v.count,
              }))}
              color="#E8913A"
            />
          ) : (
            <p className="text-sm text-foreground-muted/50 py-4 text-center">{t("noStats")}</p>
          )}
        </Section>
      </div>
    </div>
  );
}
