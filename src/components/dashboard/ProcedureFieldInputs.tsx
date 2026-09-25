"use client";

import { useTranslations } from "next-intl";
import type { FormField, ProcedureForm } from "@/lib/hooks/useProcedureData";

// Renders the inputs of one procedure form (from GET /procedures/forms),
// used both when recording a visit and when editing a saved record.

export const RESULT_NEGATIVE = "უარყოფითი";
export const RESULT_POSITIVE = "დადებითი";

type VisitT = ReturnType<typeof useTranslations<"visit">>;

/** The options a select offers, following its parent field for dependent lists. */
export function optionsFor(field: FormField, values: Record<string, string>): string[] {
  if (field.depends_on) return field.options_by?.[values[field.depends_on] ?? ""] ?? [];
  return field.options ?? [];
}

/**
 * Required fields still empty. `skip` lists columns not shown in this
 * form (price is always separate): a hidden field can never be filled, so
 * it must not block saving — e.g. a saved microchip record keeps its chip
 * number in `coment`, and the edit form hides the `chip` input.
 */
export function missingFields(values: Record<string, string>, form: ProcedureForm | undefined, skip: string[] = ["price"]): FormField[] {
  if (!form) return [];
  return form.fields.filter((f) => f.required && !skip.includes(f.column) && !(values[f.column] ?? "").trim());
}

/** Clears a dependent select whose value no longer fits its parent. */
export function withDependents(form: ProcedureForm | undefined, values: Record<string, string>, changed: string): Record<string, string> {
  const next = { ...values };
  for (const f of form?.fields ?? []) {
    if (f.depends_on === changed && next[f.column] && !optionsFor(f, next).includes(next[f.column])) next[f.column] = "";
  }
  return next;
}

/** Translatable labels for columns every form shares; product names stay as data. */
const COLUMN_LABEL_KEYS: Record<string, string> = {
  coment: "ownerComment",
  date2: "nextDueDate",
  anam: "anamnesis",
  diagn: "diagnosis",
  nout: "treatment",
  koment: "vetNotes",
  dani: "prescription",
};

export function fieldLabel(f: FormField, t: VisitT): string {
  const key = COLUMN_LABEL_KEYS[f.column];
  if (key) return t(key);
  if (f.column === "ser" && f.kind === "text" && f.label === "სერია") return t("serial");
  return f.label;
}

const input = "mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const label = "text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/50";

export function ProcedureFieldInputs({
  form, values, onChange, skip = ["price"],
}: {
  form: ProcedureForm | undefined;
  values: Record<string, string>;
  onChange: (column: string, value: string) => void;
  skip?: string[];
}) {
  const t = useTranslations("visit");
  const fields = (form?.fields ?? []).filter((f) => !skip.includes(f.column));

  // Consecutive fields of one group share a heading (test panels, ecto kinds).
  const rows: { group?: string; fields: FormField[] }[] = [];
  for (const f of fields) {
    const last = rows[rows.length - 1];
    if (last && f.group && last.group === f.group) last.fields.push(f);
    else rows.push({ group: f.group, fields: [f] });
  }

  const renderField = (f: FormField) => {
    const value = values[f.column] ?? "";
    const req = f.required ? " *" : "";
    switch (f.kind) {
      case "result":
        return (
          <div key={f.column} className="flex items-center justify-between gap-2 py-1">
            <span className="text-sm text-primary-dark">{f.label}</span>
            <div className="flex gap-1">
              {[RESULT_NEGATIVE, RESULT_POSITIVE].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={value === r}
                  onClick={() => onChange(f.column, value === r ? "" : r)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    value === r
                      ? r === RESULT_POSITIVE ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                      : "bg-gray-100 text-foreground-muted hover:bg-gray-200"
                  }`}
                >
                  {r === RESULT_POSITIVE ? t("positive") : t("negative")}
                </button>
              ))}
            </div>
          </div>
        );
      case "select": {
        const opts = optionsFor(f, values);
        // Keep a legacy value that is no longer in the list selectable.
        const all = value && !opts.includes(value) ? [value, ...opts] : opts;
        return (
          <label key={f.column} className="block">
            <span className={label}>{fieldLabel(f, t)}{req}</span>
            <select value={value} onChange={(e) => onChange(f.column, e.target.value)} className={input} disabled={!!f.depends_on && all.length === 0}>
              <option value="">{t("select")}</option>
              {all.map((o) => (
                <option key={o} value={o}>{o === "სხვა" ? t("other") : o}</option>
              ))}
            </select>
          </label>
        );
      }
      case "textarea":
        return (
          <label key={f.column} className="block sm:col-span-2">
            <span className={label}>{fieldLabel(f, t)}{req}</span>
            <textarea value={value} rows={2} onChange={(e) => onChange(f.column, e.target.value)} className={input} />
          </label>
        );
      case "date":
        return (
          <label key={f.column} className="block">
            <span className={label}>{fieldLabel(f, t)}{req}</span>
            <input type="date" value={value} onChange={(e) => onChange(f.column, e.target.value)} className={input} />
          </label>
        );
      default:
        return (
          <label key={f.column} className="block">
            <span className={label}>{fieldLabel(f, t)}{req}</span>
            <input type="text" value={value} onChange={(e) => onChange(f.column, e.target.value)} className={input} />
          </label>
        );
    }
  };

  return (
    <div className="space-y-3">
      {rows.map((row, i) =>
        row.group ? (
          <div key={i} className="rounded-lg border border-gray-100 p-3">
            <p className="mb-1 text-xs font-bold text-primary-dark">{row.group}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{row.fields.map(renderField)}</div>
          </div>
        ) : (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">{row.fields.map(renderField)}</div>
        ),
      )}
    </div>
  );
}
