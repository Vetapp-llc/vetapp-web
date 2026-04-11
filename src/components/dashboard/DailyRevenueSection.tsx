"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  useDailyClinicStats,
  useMonthlyClinicStats,
  useYearlyClinicStats,
} from "@/lib/hooks/useClinicData";
import { SummaryCard, Section, SkeletonCard, HorizontalBarChart } from "./shared";
import type { ProcedureTypeRevenue } from "@/lib/types/api";

type Period = "daily" | "monthly" | "yearly";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function currentYear() {
  return new Date().getFullYear().toString();
}

function shiftDate(date: string, days: number) {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftYear(year: string, delta: number) {
  return String(Number(year) + delta);
}

/* ─── Shared Procedures Table ─── */
function ProceduresTable({
  procedures,
  emptyMessage,
  t,
}: {
  procedures: ProcedureTypeRevenue[];
  emptyMessage: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (procedures.length === 0) {
    return (
      <p className="text-sm text-foreground-muted/50 py-4 text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-foreground-muted/40 uppercase tracking-wider">
            <th className="pb-2 px-2 font-semibold">{t("procedureType")}</th>
            <th className="pb-2 px-2 font-semibold text-right">{t("procedureCount")}</th>
            <th className="pb-2 px-2 font-semibold text-right">{t("procedureTotal")}</th>
          </tr>
        </thead>
        <tbody>
          {procedures.map((p: { tp: number; tpname: string; count: number; total: string }, i: number) => (
            <tr key={`${p.tp}-${i}`} className="border-t border-surface/30">
              <td className="py-2 px-2 text-primary-dark font-medium truncate max-w-[200px]">
                {p.tpname || `Type ${p.tp}`}
              </td>
              <td className="py-2 px-2 text-right font-bold text-primary-dark tabular-nums">
                {p.count}
              </td>
              <td className="py-2 px-2 text-right font-bold text-primary-dark tabular-nums">
                {p.total} ₾
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Nav Arrow Buttons ─── */
function NavButton({
  onClick,
  label,
  direction,
}: {
  onClick: () => void;
  label: string;
  direction: "prev" | "next";
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-foreground-muted/60 hover:bg-gray-50 hover:text-primary-dark transition-colors cursor-pointer"
      aria-label={label}
    >
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        {direction === "prev" ? (
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        )}
      </svg>
    </button>
  );
}

/* ─── Revenue Icon ─── */
const revenueIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
  </svg>
);

const cashIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
  </svg>
);

const cardIcon = (
  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
  </svg>
);

/* ─── Daily View ─── */
function DailyView({ clinic }: { clinic?: string }) {
  const t = useTranslations("clinic");
  const [date, setDate] = useState(todayStr);
  const { data, isLoading } = useDailyClinicStats(date, clinic);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 -mt-1">
        <NavButton onClick={() => setDate((d) => shiftDate(d, -1))} label={t("prevDay")} direction="prev" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-primary-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <NavButton onClick={() => setDate((d) => shiftDate(d, 1))} label={t("nextDay")} direction="next" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3">
          <SkeletonCard /> <SkeletonCard /> <SkeletonCard />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <SummaryCard label={t("dailyTotal")} value={`${data.total} ₾`} accent="#0472D8" icon={revenueIcon} />
            <SummaryCard label={t("cash")} value={`${data.cash} ₾`} accent="#1A9A6B" icon={cashIcon} />
            <SummaryCard label={t("card")} value={`${data.card} ₾`} accent="#9B59B6" icon={cardIcon} />
          </div>
          <ProceduresTable procedures={data.procedures} emptyMessage={t("noProcedures")} t={t} />
        </>
      ) : null}
    </>
  );
}

/* ─── Monthly View ─── */
function MonthlyView({ clinic }: { clinic?: string }) {
  const t = useTranslations("clinic");
  const [month, setMonth] = useState(currentMonth);
  const { data, isLoading } = useMonthlyClinicStats(month, clinic);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 -mt-1">
        <NavButton onClick={() => setMonth((m) => shiftMonth(m, -1))} label={t("prevMonth")} direction="prev" />
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-primary-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <NavButton onClick={() => setMonth((m) => shiftMonth(m, 1))} label={t("nextMonth")} direction="next" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          <SkeletonCard />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <SummaryCard label={t("monthlyTotal")} value={`${data.total} ₾`} accent="#0472D8" icon={revenueIcon} />
          </div>

          <ProceduresTable procedures={data.procedures} emptyMessage={t("noProcedures")} t={t} />

          {data.dailyBreakdown.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted/50 mb-3">
                {t("dailyBreakdown")}
              </h4>
              <HorizontalBarChart
                data={data.dailyBreakdown.map((d: { date: string; total: string }) => ({
                  label: d.date,
                  value: Number(d.total) || 0,
                }))}
                color="#0472D8"
                renderValue={(v) => `${v} ₾`}
              />
            </div>
          )}
        </>
      ) : null}
    </>
  );
}

/* ─── Yearly View ─── */
function YearlyView({ clinic }: { clinic?: string }) {
  const t = useTranslations("clinic");
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useYearlyClinicStats(year, clinic);

  return (
    <>
      <div className="flex items-center gap-2 mb-4 -mt-1">
        <NavButton onClick={() => setYear((y) => shiftYear(y, -1))} label={t("prevYear")} direction="prev" />
        <div className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm font-medium text-primary-dark">
          {year}
        </div>
        <NavButton onClick={() => setYear((y) => shiftYear(y, 1))} label={t("nextYear")} direction="next" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3">
          <SkeletonCard />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-3 mb-4">
            <SummaryCard label={t("yearlyTotal")} value={`${data.total} ₾`} accent="#0472D8" icon={revenueIcon} />
          </div>

          <ProceduresTable procedures={data.procedures} emptyMessage={t("noProcedures")} t={t} />

          {data.monthlyBreakdown.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground-muted/50 mb-3">
                {t("monthlyBreakdown")}
              </h4>
              <HorizontalBarChart
                data={data.monthlyBreakdown.map((m: { month: string; total: string }) => ({
                  label: m.month,
                  value: Number(m.total) || 0,
                }))}
                color="#1A9A6B"
                renderValue={(v) => `${v} ₾`}
              />
            </div>
          )}
        </>
      ) : null}
    </>
  );
}

/* ─── Main Export ─── */
export function DailyRevenueSection({ clinic }: { clinic?: string }) {
  const t = useTranslations("clinic");
  const [period, setPeriod] = useState<Period>("daily");

  const tabs: { id: Period; label: string }[] = [
    { id: "daily", label: t("daily") },
    { id: "monthly", label: t("monthly") },
    { id: "yearly", label: t("yearly") },
  ];

  return (
    <Section title={t("revenue")}>
      {/* Period tabs */}
      <div className="flex gap-1 mb-4 -mt-1 rounded-lg bg-surface/40 p-1 w-fit">
        {tabs.map((tab: { id: Period; label: string }) => (
          <button
            key={tab.id}
            onClick={() => setPeriod(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              period === tab.id
                ? "bg-white text-primary shadow-sm"
                : "text-foreground-muted/60 hover:text-primary-dark"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {period === "daily" && <DailyView clinic={clinic} />}
      {period === "monthly" && <MonthlyView clinic={clinic} />}
      {period === "yearly" && <YearlyView clinic={clinic} />}
    </Section>
  );
}
