"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { apiRequest, todayGeorgia } from "@/lib/api/request";
import { localizeProcedureType } from "@/lib/utils/localize";
import { useProcedureForms, type ProcedureForm } from "@/lib/hooks/useProcedureData";
import {
  usePetProcedures, useUnpaidProcedures, useProcedureFiles, useStaff, useInvalidatePet, type ProcedureRow,
} from "@/lib/hooks/useClinicFeatures";
import { Pagination } from "../Pagination";
import { Button, ConfirmButton, Empty, Field, Modal, Notice, PaidBadge, inputClass } from "@/components/ui/kit";
import { ProcedureFieldInputs, RESULT_POSITIVE, fieldLabel, missingFields, withDependents } from "../ProcedureFieldInputs";

// A pet's records at this clinic, with the actions of vet/procedures.php:
// edit a record, delete an unpaid one, attach lab files, and take payment
// for the unpaid items.

const PRICE_RE = /^\d{1,9}(\.\d{1,2})?$/;

function recordValues(r: ProcedureRow): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(r)) if (typeof v === "string") out[k] = v;
  return out;
}

function formFor(forms: ProcedureForm[] | undefined, tp: number) {
  return forms?.find((f) => f.tp === tp);
}

export function PetRecords({ petId, species }: { petId: string; species: string }) {
  const t = useTranslations("features");
  const tv = useTranslations("visit");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePetProcedures(petId, page);
  // Unpaid items come from their own query: a page of history must never
  // decide the balance (an old unpaid item can sit behind newer paid ones).
  const { data: unpaidData } = useUnpaidProcedures(petId);
  const { data: forms } = useProcedureForms(species);
  const { data: staff } = useStaff();
  const invalidate = useInvalidatePet();
  const [editing, setEditing] = useState<ProcedureRow | null>(null);
  const [paying, setPaying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const records = data?.data ?? [];
  const unpaid = unpaidData?.data ?? [];
  const vetName = (id: string) => staff?.find((s) => String(s.id) === id)?.first_name ?? "";

  const remove = async (r: ProcedureRow) => {
    setActionError(null);
    try {
      await apiRequest("DELETE", `/procedures/${r.id}`);
      invalidate(petId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t("error"));
    }
  };

  if (isLoading) return <p className="text-sm text-foreground-muted/60">{t("loading")}</p>;
  if (error) return <Notice>{error.message}</Notice>;

  return (
    <div className="space-y-3">
      {actionError && <Notice>{actionError}</Notice>}

      {unpaid.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm text-amber-900">
            <b>{t("unpaidItems")}:</b> {unpaidData?.total ?? unpaid.length} · {unpaid.reduce((s, r) => s + (parseFloat(r.price) || 0), 0)} ₾
            {(unpaidData?.total ?? 0) > unpaid.length && <span className="ml-1 text-xs">({unpaid.length} / {unpaidData?.total})</span>}
          </div>
          <Button small onClick={() => setPaying(true)}>{t("takePayment")}</Button>
        </div>
      )}

      {records.length === 0 ? (
        <Empty>{t("none")}</Empty>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-foreground-muted/50">{data?.total ?? records.length}</p>
          {records.map((r) => (
            <RecordItem
              key={r.id}
              record={r}
              petId={petId}
              form={formFor(forms, r.tp)}
              vetName={vetName(r.vetname)}
              locale={locale}
              onEdit={() => setEditing(r)}
              onDelete={() => remove(r)}
            />
          ))}
          {data && data.totalPages > 1 && <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />}
        </div>
      )}

      {editing && (
        <EditRecordModal
          record={editing}
          form={formFor(forms, editing.tp)}
          staff={staff ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); invalidate(petId); }}
        />
      )}
      {paying && (
        <PayUnpaidModal
          petId={petId}
          items={unpaid}
          locale={locale}
          onClose={() => setPaying(false)}
          onPaid={() => { setPaying(false); invalidate(petId); }}
        />
      )}
      <p className="sr-only">{tv("price")}</p>
    </div>
  );
}

function RecordItem({
  record: r, petId, form, vetName, locale, onEdit, onDelete,
}: {
  record: ProcedureRow;
  petId: string;
  form: ProcedureForm | undefined;
  vetName: string;
  locale: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("features");
  const tv = useTranslations("visit");
  const [open, setOpen] = useState(false);
  const paid = r.phone === "1";
  const values = recordValues(r);
  const shown = (form?.fields ?? []).filter((f) => f.column !== "price" && (values[f.column] ?? "").trim());

  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-primary-dark">{localizeProcedureType(r.tpname, locale)}</span>
            {r.vac && <span className="truncate text-xs text-foreground-muted/60">{r.vac}</span>}
            <PaidBadge paid={paid} paidLabel={t("paid")} unpaidLabel={t("unpaid")} />
          </div>
          <p className="mt-0.5 text-xs text-foreground-muted/60">
            {r.date}{vetName ? ` · ${vetName}` : ""}{r.price ? ` · ${r.price} ₾` : ""}
            {r.date2 && /^\d{4}-/.test(r.date2) ? ` · ${t("nextDue")}: ${r.date2}` : ""}
          </p>
        </div>
        <span className={`text-foreground-muted/40 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-gray-50 px-4 py-3 text-sm">
          {shown.length > 0 ? (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
              {shown.map((f) => (
                <div key={f.column} className="flex justify-between gap-2 border-b border-gray-50 py-1">
                  <dt className="text-foreground-muted/70">{f.group ? `${f.group} — ` : ""}{fieldLabel(f, tv)}</dt>
                  <dd className={`text-right font-medium ${f.kind === "result" && values[f.column] === RESULT_POSITIVE ? "text-red-600" : "text-primary-dark"}`}>
                    {f.kind === "result" ? (values[f.column] === RESULT_POSITIVE ? tv("positive") : tv("negative")) : values[f.column]}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          {r.name && <p className="text-xs text-foreground-muted/50">{t("editLog")}: {r.name}</p>}
          <div className="flex flex-wrap gap-2">
            <Button small variant="secondary" onClick={onEdit}>{t("edit")}</Button>
            {!paid && <ConfirmButton confirmLabel={t("confirmDelete")} onConfirm={onDelete}>{t("delete")}</ConfirmButton>}
          </div>
          <RecordFiles petId={petId} procId={r.id} />
        </div>
      )}
    </div>
  );
}

function RecordFiles({ petId, procId }: { petId: string; procId: number }) {
  const t = useTranslations("features");
  const { data: files, refetch } = useProcedureFiles(petId, procId);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const base = `/pets/${petId}/procedures/${procId}/files`;

  const upload = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await apiRequest("POST", base, fd);
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openFile = async (id: number) => {
    try {
      const res = await apiRequest<{ url: string }>("GET", `${base}/${id}`);
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    }
  };

  const remove = async (id: number) => {
    try {
      await apiRequest("DELETE", `${base}/${id}`);
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    }
  };

  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-primary-dark">{t("files")}</span>
        <label className="cursor-pointer text-xs font-semibold text-primary">
          {busy ? t("uploading") : t("upload")}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      </div>
      {err && <Notice>{err}</Notice>}
      {files && files.length > 0 ? (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-xs">
              <button onClick={() => openFile(f.id)} className="truncate text-left text-primary underline cursor-pointer">{f.fileName}</button>
              <ConfirmButton confirmLabel={t("confirmDelete")} onConfirm={() => remove(f.id)}>{t("delete")}</ConfirmButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-foreground-muted/50">{t("noFiles")} · {t("fileHint")}</p>
      )}
    </div>
  );
}

function EditRecordModal({
  record, form, staff, onClose, onSaved,
}: {
  record: ProcedureRow;
  form: ProcedureForm | undefined;
  staff: { id: number; first_name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("features");
  const tv = useTranslations("visit");
  const [values, setValues] = useState<Record<string, string>>(() => recordValues(record));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const paid = record.phone === "1";
  const hidden = ["price", "chip"];
  const missing = missingFields(values, form, hidden);
  const badPrice = values.price?.trim() && !PRICE_RE.test(values.price.trim());

  // Only the columns the form knows plus the shared ones are sent.
  const editable = useMemo(() => {
    const cols = new Set(["date", "date2", "price", "vetname", "anam", "diagn", "koment", "coment"]);
    for (const f of form?.fields ?? []) cols.add(f.column);
    cols.delete("chip"); // the chip number lives in coment on saved records
    return [...cols];
  }, [form]);

  const save = async () => {
    setSaving(true);
    setErr(null);
    const body: Record<string, string> = {};
    for (const c of editable) if ((values[c] ?? "") !== ((record as unknown as Record<string, string>)[c] ?? "")) body[c] = values[c] ?? "";
    try {
      if (Object.keys(body).length > 0) await apiRequest("PUT", `/procedures/${record.id}`, body);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={`${t("editRecord")} — ${record.tpname}`} onClose={onClose} wide>
      <div className="space-y-4">
        {err && <Notice>{err}</Notice>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label={t("date")}>
            <input type="date" className={inputClass} value={values.date ?? ""} onChange={(e) => setValues({ ...values, date: e.target.value })} />
          </Field>
          <Field label={t("price")}>
            <input className={`${inputClass} ${badPrice ? "border-red-400" : ""}`} value={values.price ?? ""} disabled={paid} onChange={(e) => setValues({ ...values, price: e.target.value })} />
          </Field>
          <Field label={t("vet")}>
            <select className={inputClass} value={values.vetname ?? ""} onChange={(e) => setValues({ ...values, vetname: e.target.value })}>
              {!staff.some((s) => String(s.id) === values.vetname) && <option value={values.vetname ?? ""}>{values.vetname || "—"}</option>}
              {staff.map((s) => <option key={s.id} value={String(s.id)}>{s.first_name}</option>)}
            </select>
          </Field>
        </div>
        {paid && <p className="text-xs text-foreground-muted/60">{t("paidLocked")}</p>}
        <ProcedureFieldInputs
          form={form}
          values={values}
          onChange={(col, v) => setValues(withDependents(form, { ...values, [col]: v }, col))}
          skip={hidden}
        />
        {missing.length > 0 && <p className="text-xs text-red-600">{tv("requiredMissing")}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={save} disabled={saving || missing.length > 0 || !!badPrice}>{saving ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PayUnpaidModal({
  petId, items, locale, onClose, onPaid,
}: {
  petId: string;
  items: ProcedureRow[];
  locale: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const t = useTranslations("features");
  const [selected, setSelected] = useState<Set<number>>(() => new Set(items.map((i) => i.id)));
  const sum = items.filter((i) => selected.has(i.id)).reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const [amount, setAmount] = useState(String(sum));
  const [method, setMethod] = useState<"cash" | "card">("cash");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setAmount(String(items.filter((i) => next.has(i.id)).reduce((s, i) => s + (parseFloat(i.price) || 0), 0)));
  };

  const pay = async () => {
    setBusy(true);
    setErr(null);
    try {
      await apiRequest("POST", "/payments/record", {
        uuid: petId, date: todayGeorgia(), method, amount: amount.trim(), procedure_ids: [...selected],
      });
      onPaid();
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title={t("takePayment")} onClose={onClose}>
      <div className="space-y-3">
        {err && <Notice>{err}</Notice>}
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.id}>
              <label className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50">
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} />
                  {localizeProcedureType(i.tpname, locale)} <span className="text-xs text-foreground-muted/60">{i.date}</span>
                </span>
                <span className="font-semibold">{i.price || 0} ₾</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("amount")}>
            <input className={inputClass} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label={t("method")}>
            <select className={inputClass} value={method} onChange={(e) => setMethod(e.target.value as "cash" | "card")}>
              <option value="cash">{t("cash")}</option>
              <option value="card">{t("card")}</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={pay} disabled={busy || selected.size === 0 || !PRICE_RE.test(amount.trim())}>
            {busy ? t("saving") : `${t("takePayment")} ${amount} ₾`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
