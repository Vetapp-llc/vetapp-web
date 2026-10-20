"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRangeClinicStats } from "@/lib/hooks/useClinicData";
import { todayGeorgia } from "@/lib/api/request";
import { localizeProcedureType } from "@/lib/utils/localize";
import { Section, SummaryCard, SkeletonCard, HorizontalBarChart } from "./shared";

// Statistics for a period (1 day to 1 year, ending on a chosen day) and
// for one or several procedure types at once.

const PERIODS = [
  { id: "day", months: 0 },
  { id: "month", months: 1 },
  { id: "3months", months: 3 },
  { id: "6months", months: 6 },
  { id: "year", months: 12 },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];

/** First day of a period of `months` months that ends on `end`. */
function periodStart(end: string, months: number): string {
  if (months === 0) return end;
  const [y, m, d] = end.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 - months, d + 1)).toISOString().slice(0, 10);
}

export function ProcedureStatsSection() {
  const t = useTranslations("clinic");
  const locale = useLocale();
  const [period, setPeriod] = useState<PeriodId>("month");
  const [end, setEnd] = useState(todayGeorgia);
  const [selected, setSelected] = useState<string[]>([]);
  const from = periodStart(end, PERIODS.find((p) => p.id === period)!.months);
  const { data, isLoading, isFetching } = useRangeClinicStats(from, end, selected);

  const toggle = (tp: string) =>
    setSelected((s) => (s.includes(tp) ? s.filter((x) => x !== tp) : [...s, tp]));
  // A selected type stays offered even when the new period has none of it.
  const types = [...(data?.types ?? [])];
  for (const tp of selected) {
    if (!types.some((x) => x.tp === tp)) types.push({ tp, tpname: tp, count: 0, total: "0" });
  }
  const name = (n: string) => localizeProcedureType(n, locale) || n;
  const chip = (on: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      on ? "bg-primary text-white" : "bg-gray-100 text-foreground-muted hover:bg-gray-200"
    }`;

  return (
    <Section title={t("filteredStats")}>
      <div className="-mt-1 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg bg-surface/40 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id ? "bg-white text-primary shadow-sm" : "text-foreground-muted/60 hover:text-primary-dark"
                }`}
              >
                {t(`period.${p.id}`)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground-muted/70">
            {period === "day" ? t("date") : t("periodEnd")}
            <input
              type="date"
              value={end}
              max={todayGeorgia()}
              onChange={(e) => e.target.value && setEnd(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-primary-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <span className="text-xs text-foreground-muted/50 tabular-nums">{from === end ? end : `${from} — ${end}`}</span>
        </div>

        <div>
          <p className="mb-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-foreground-muted/60">{t("procedures")}</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelected([])} className={chip(selected.length === 0)}>{t("all")}</button>
            {types.map((x) => (
              <button key={x.tp} onClick={() => toggle(x.tp)} aria-pressed={selected.includes(x.tp)} className={chip(selected.includes(x.tp))}>
                {name(x.tpname)} <span className="opacity-60">{x.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3"><SkeletonCard /> <SkeletonCard /></div>
      ) : (
        <div className={`space-y-4 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label={t("procedureCount")} value={String(data.count)} accent="#E8913A" icon={countIcon} />
            <SummaryCard label={t("procedureTotal")} value={`${data.total} ₾`} accent="#0472D8" icon={revenueIcon} />
          </div>

          {data.procedures.length === 0 ? (
            <p className="py-4 text-center text-sm text-foreground-muted/50">{t("noProceduresInPeriod")}</p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left uppercase tracking-wider text-foreground-muted/40">
                    <th className="px-2 pb-2 font-semibold">{t("procedureType")}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{t("procedureCount")}</th>
                    <th className="px-2 pb-2 text-right font-semibold">{t("procedureTotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.procedures.map((p) => (
                    <tr key={p.tp} className="border-t border-surface/30">
                      <td className="px-2 py-2 font-medium text-primary-dark">{name(p.tpname)}</td>
                      <td className="px-2 py-2 text-right font-bold tabular-nums text-primary-dark">{p.count}</td>
                      <td className="px-2 py-2 text-right font-bold tabular-nums text-primary-dark">{p.total} ₾</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.breakdown.length > 1 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground-muted/50">
                {data.byMonth ? t("monthlyBreakdown") : t("dailyBreakdown")}
              </h4>
              <HorizontalBarChart
                data={[...data.breakdown].reverse().map((b) => ({ label: `${b.period} (${b.count})`, value: Number(b.total) || 0 }))}
                color="#0472D8"
                renderValue={(v) => `${v} ₾`}
              />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

const revenueIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
  </svg>
);

const countIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
  </svg>
);
