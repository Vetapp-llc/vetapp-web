"use client";

/* ─── Color palette for charts ─── */
export const SPECIES_COLORS = [
  "#0472D8", "#1A9A6B", "#E8913A", "#9B59B6", "#E74C5E",
  "#2BC4C4", "#5B6ABF", "#D4A843", "#34495E", "#E06090",
];

export const CHART_BLUE = "#0472D8";

/* ─── Helpers ─── */
export function fmtNum(n: number) {
  return n.toLocaleString();
}

export function pct(value: number, max: number) {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
}

/* ─── Skeleton blocks ─── */
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="h-3 w-20 rounded bg-gray-100 mb-3" />
      <div className="h-7 w-28 rounded bg-gray-100" />
    </div>
  );
}

export function SkeletonChart({ h = "h-48" }: { h?: string }) {
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

export function LoadingSkeleton() {
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
export function SummaryCard({
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
export function DonutChart({
  data,
  colors,
}: {
  data: { label: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce((s: number, d: { label: string; value: number }) => s + d.value, 0);
  if (total === 0) return null;

  let accumulated = 0;
  const segments = data.map((d: { label: string; value: number }, i: number) => {
    const percentage = (d.value / total) * 100;
    const start = accumulated;
    accumulated += percentage;
    return { ...d, percentage, start, color: colors[i % colors.length] };
  });

  const gradientStops = segments
    .map((s: { color: string; start: number; percentage: number }) => `${s.color} ${s.start}% ${s.start + s.percentage}%`)
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
        {segments.map((s: { label: string; value: number; percentage: number; start: number; color: string }) => (
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
export function HorizontalBarChart({
  data,
  color = CHART_BLUE,
  renderValue,
}: {
  data: { label: string; value: number }[];
  color?: string;
  renderValue?: (value: number) => string;
}) {
  const max = Math.max(...data.map((d: { label: string; value: number }) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d: { label: string; value: number }, i: number) => (
        <div key={`${d.label}-${i}`} className="flex items-center gap-3">
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
export function Section({
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
