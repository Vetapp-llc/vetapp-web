"use client";

import { useTranslations } from "next-intl";
import { useClinicStats } from "@/lib/hooks/useClinicData";

/* ─── Color palette for charts ─── */
const SPECIES_COLORS = [
  "#0472D8", "#1A9A6B", "#E8913A", "#9B59B6", "#E74C5E",
  "#2BC4C4", "#5B6ABF", "#D4A843", "#34495E", "#E06090",
];

const CHART_BLUE = "#0472D8";

/* ─── Helpers ─── */
function fmtNum(n: number) {
  return n.toLocaleString();
}

function pct(value: number, max: number) {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

/* ─── Skeleton blocks ─── */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="h-3 w-20 rounded bg-gray-100 mb-3" />
      <div className="h-7 w-28 rounded bg-gray-100" />
    </div>
  );
}

function SkeletonChart({ h = "h-48" }: { h?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${h}`}>
      <div className="h-4 w-32 rounded bg-gray-100 mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-4/5 rounded bg-gray-100" />
        <div className="h-3 w-3/5 rounded bg-gray-100" />
        <div className="h-3 w-2/5 rounded bg-gray-100" />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-results-in">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <SkeletonChart h="h-56" />
        <SkeletonChart h="h-56" />
      </div>
      <SkeletonChart h="h-64" />
      <SkeletonChart h="h-72" />
    </div>
  );
}

/* ─── Summary Card ─── */
function SummaryCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="group rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted/50">
          {label}
        </p>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl transition-colors"
          style={{ backgroundColor: `${accent}15`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold tracking-tight text-primary-dark">
        {value}
      </p>
    </div>
  );
}

/* ─── CSS-only Donut Chart ─── */
function DonutChart({
  data,
  colors,
}: {
  data: { label: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let accumulated = 0;
  const segments = data.map((d, i) => {
    const percentage = (d.value / total) * 100;
    const start = accumulated;
    accumulated += percentage;
    return { ...d, percentage, start, color: colors[i % colors.length] };
  });

  const gradientStops = segments
    .map((s) => `${s.color} ${s.start}% ${s.start + s.percentage}%`)
    .join(", ");

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-36 w-36 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      >
        <div className="absolute inset-[25%] rounded-full bg-white flex items-center justify-center">
          <span className="text-lg font-extrabold text-primary-dark">
            {fmtNum(total)}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 min-w-0">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs text-foreground-muted/70 truncate">
              {s.label}
            </span>
            <span className="ml-auto text-xs font-bold text-primary-dark shrink-0">
              {s.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Horizontal Bar Chart ─── */
function HorizontalBarChart({
  data,
  color = CHART_BLUE,
  renderValue,
}: {
  data: { label: string; value: number }[];
  color?: string;
  renderValue?: (value: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="shrink-0 text-xs text-foreground-muted/70 text-right">
            {d.label}
          </span>
          <div className="flex-1 h-5 rounded-full bg-surface/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct(d.value, max)}%`,
                backgroundColor: color,
                minWidth: d.value > 0 ? "4px" : 0,
              }}
            />
          </div>
          <span className="w-14 shrink-0 text-xs font-bold text-primary-dark text-right">
            {renderValue ? renderValue(d.value) : fmtNum(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-muted/50">
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ─── MAIN STATS TAB ───
   ═══════════════════════════════════════════ */
export function StatsTab() {
  const t = useTranslations("clinic");
  const { data: stats, isLoading } = useClinicStats();

  if (isLoading || !stats) {
    return <LoadingSkeleton />;
  }

  const trends = [...(stats.monthlyTrends ?? [])].reverse();
  const maxRecords = Math.max(...trends.map((m) => m.records ?? 0), 1);

  return (
    <div className="space-y-5 animate-results-in">
      {/* ── Row 1: Summary Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label={t("totalPets")}
          value={fmtNum(stats.totalPets ?? 0)}
          accent="#0472D8"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.5 2C5.12 2 4 3.12 4 4.5S5.12 7 6.5 7 9 5.88 9 4.5 7.88 2 6.5 2zM13.5 2C12.12 2 11 3.12 11 4.5S12.12 7 13.5 7 16 5.88 16 4.5 14.88 2 13.5 2zM3 9c-1.38 0-2.5 1.12-2.5 2.5S1.62 14 3 14s2.5-1.12 2.5-2.5S4.38 9 3 9zM17 9c-1.38 0-2.5 1.12-2.5 2.5S15.62 14 17 14s2.5-1.12 2.5-2.5S18.38 9 17 9zM10 8c-2.21 0-4 2.24-4 5s1.79 5 4 5 4-2.24 4-5-1.79-5-4-5z" />
            </svg>
          }
        />
        <SummaryCard
          label={t("totalOwners")}
          value={fmtNum(stats.totalOwners ?? 0)}
          accent="#1A9A6B"
          icon={
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          }
        />
        <SummaryCard
          label={t("totalRecords")}
          value={fmtNum(stats.totalRecords ?? 0)}
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
            data={(stats.speciesBreakdown ?? []).map((s) => ({
              label: s.species || "—",
              value: s.count ?? 0,
            }))}
            colors={SPECIES_COLORS}
          />
        </Section>

        <Section title={t("sexDistribution")}>
          <HorizontalBarChart
            data={(stats.sexDistribution ?? []).map((s) => ({
              label: s.sex || "—",
              value: s.count ?? 0,
            }))}
            color="#1A9A6B"
          />
        </Section>
      </div>

      {/* ── Row 3: Top Breeds ── */}
      <Section title={t("topBreeds")}>
        <HorizontalBarChart
          data={(stats.topBreeds ?? []).map((b) => ({
            label: b.breed ?? "",
            value: b.count ?? 0,
          }))}
        />
      </Section>

      {/* ── Row 4: Monthly Trends ── */}
      <Section title={t("monthlyTrends")}>
        {trends.length > 0 ? (
          <div className="space-y-2">
            {trends.map((m) => (
              <div key={m.month ?? ""} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs font-medium text-foreground-muted/60 text-right tabular-nums">
                  {m.month}
                </span>
                <div className="flex-1 h-5 rounded-full bg-surface/40 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct(m.records ?? 0, maxRecords)}%`,
                      backgroundColor: CHART_BLUE,
                      minWidth: (m.records ?? 0) > 0 ? "4px" : 0,
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-xs font-bold text-primary-dark text-right tabular-nums">
                  {fmtNum(m.records ?? 0)}
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
          {(stats.topProcedures ?? []).length > 0 ? (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-foreground-muted/40 uppercase tracking-wider">
                    <th className="pb-2 px-2 font-semibold">{t("topProcedures")}</th>
                    <th className="pb-2 px-2 font-semibold text-right">{t("count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.topProcedures ?? []).map((p) => (
                    <tr
                      key={`${p.type}-${p.name}`}
                      className="border-t border-surface/30"
                    >
                      <td className="py-2 px-2 text-primary-dark font-medium truncate max-w-[160px]">
                        {p.name || p.type || "—"}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-primary-dark tabular-nums">
                        {fmtNum(p.count ?? 0)}
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
          {(stats.topVaccines ?? []).length > 0 ? (
            <HorizontalBarChart
              data={(stats.topVaccines ?? []).map((v) => ({
                label: v.name ?? "",
                value: v.count ?? 0,
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
