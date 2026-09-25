"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, todayGeorgia } from "@/lib/api/request";
import {
  useSales, usePrices, useStaff, useAppointments, usePromo, type Sale, type PriceItem, type StaffMember,
} from "@/lib/hooks/useClinicFeatures";
import { Pagination } from "../Pagination";
import { Button, Card, ConfirmButton, Empty, Field, Modal, Notice, PageTitle, inputClass } from "@/components/ui/kit";
import { BookAppointmentModal } from "../pet/PetExtras";
import { getStoredSession } from "@/lib/utils/session";

const MONEY = /^\d{1,9}(\.\d{1,2})?$/;

function monthStart(): string {
  return todayGeorgia().slice(0, 8) + "01";
}

function useError() {
  const t = useTranslations("features");
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
      return false;
    }
  };
  return { err, run, setErr };
}

/* ─── Shop (vet/shop.php, shopadd.php, shopadit.php) ─── */

export function ShopView() {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const [from, setFrom] = useState(todayGeorgia());
  const [to, setTo] = useState(todayGeorgia());
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSales(from, to, page);
  const [editing, setEditing] = useState<Sale | "new" | null>(null);
  const { err, run } = useError();
  const refresh = () => qc.invalidateQueries({ queryKey: ["shop"] });

  return (
    <div>
      <PageTitle actions={<Button onClick={() => setEditing("new")}>{t("addSale")}</Button>}>{t("shop")}</PageTitle>
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("from")}><input type="date" className={inputClass} value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} /></Field>
          <Field label={t("to")}><input type="date" className={inputClass} value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} /></Field>
          <Button variant="secondary" onClick={() => { setFrom(todayGeorgia()); setTo(todayGeorgia()); setPage(1); }}>{t("today")}</Button>
          <Button variant="secondary" onClick={() => { setFrom(monthStart()); setTo(todayGeorgia()); setPage(1); }}>{todayGeorgia().slice(0, 7)}</Button>
        </div>
        {data && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-gray-50 py-2"><p className="text-[10px] uppercase text-foreground-muted/60">{t("card")}</p><p className="font-bold">{data.totals.card} ₾</p></div>
            <div className="rounded-xl bg-gray-50 py-2"><p className="text-[10px] uppercase text-foreground-muted/60">{t("cash")}</p><p className="font-bold">{data.totals.cash} ₾</p></div>
            <div className="rounded-xl bg-primary/10 py-2"><p className="text-[10px] uppercase text-foreground-muted/60">{t("total")}</p><p className="font-bold text-primary">{data.totals.total} ₾</p></div>
          </div>
        )}
      </Card>
      {err && <Notice>{err}</Notice>}
      {isLoading ? <p className="text-sm">{t("loading")}</p> : !data || data.data.length === 0 ? <Empty>{t("none")}</Empty> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] uppercase text-foreground-muted/60">
                <th className="py-2">{t("date")}</th><th>{t("product")}</th><th>{t("comment")}</th><th>{t("method")}</th><th className="text-right">{t("price")}</th><th />
              </tr></thead>
              <tbody>
                {data.data.map((s) => (
                  <tr key={s.id} className="border-t border-gray-50">
                    <td className="py-2 whitespace-nowrap">{s.date}</td>
                    <td>{s.name}</td>
                    <td className="text-foreground-muted/70">{s.comment}</td>
                    <td>{s.method === "ბარათი" ? t("card") : s.method ? t("cash") : ""}</td>
                    <td className="text-right font-semibold whitespace-nowrap">{s.price} ₾</td>
                    <td className="whitespace-nowrap text-right">
                      <Button small variant="ghost" onClick={() => setEditing(s)}>{t("edit")}</Button>
                      <ConfirmButton confirmLabel={t("confirmDelete")} onConfirm={() => run(async () => { await apiRequest("DELETE", `/shop/${s.id}`); refresh(); })}>{t("delete")}</ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </Card>
      )}
      {editing && <SaleModal sale={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function SaleModal({ sale, onClose, onSaved }: { sale: Sale | null; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("features");
  const [f, setF] = useState({
    name: sale?.name ?? "", price: sale?.price ?? "", date: sale?.date ?? todayGeorgia(),
    method: sale?.method === "ბარათი" ? "card" : "cash", comment: sale?.comment ?? "",
  });
  const [busy, setBusy] = useState(false);
  const { err, run } = useError();
  const valid = f.name.trim() && MONEY.test(f.price.trim()) && /^\d{4}-\d{2}-\d{2}$/.test(f.date);
  const save = async () => {
    setBusy(true);
    const ok = await run(() => apiRequest(sale ? "PUT" : "POST", sale ? `/shop/${sale.id}` : "/shop", { ...f, name: f.name.trim(), price: f.price.trim() }));
    setBusy(false);
    if (ok) onSaved();
  };
  return (
    <Modal open title={sale ? t("edit") : t("addSale")} onClose={onClose}>
      <div className="space-y-3">
        {err && <Notice>{err}</Notice>}
        <Field label={t("product")}><input className={inputClass} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("price")}><input className={inputClass} inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></Field>
          <Field label={t("date")}><input type="date" className={inputClass} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label={t("method")}>
            <select className={inputClass} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
              <option value="cash">{t("cash")}</option><option value="card">{t("card")}</option>
            </select>
          </Field>
          <Field label={t("comment")}><input className={inputClass} value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={save} disabled={busy || !valid}>{busy ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Price list (vet/prices.php, priceadd.php, priceadit.php) ─── */

export function PricesView() {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const { data, isLoading } = usePrices();
  const [editing, setEditing] = useState<PriceItem | "new" | null>(null);
  const [filter, setFilter] = useState("");
  const { err, run } = useError();
  const refresh = () => qc.invalidateQueries({ queryKey: ["clinic-prices"] });
  const rows = (data ?? []).filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <PageTitle actions={<Button onClick={() => setEditing("new")}>{t("addPrice")}</Button>}>{t("prices")}</PageTitle>
      <input className={`${inputClass} mb-3`} placeholder={t("search")} value={filter} onChange={(e) => setFilter(e.target.value)} />
      {err && <Notice>{err}</Notice>}
      {isLoading ? <p className="text-sm">{t("loading")}</p> : rows.length === 0 ? <Empty>{t("none")}</Empty> : (
        <Card>
          <ul className="divide-y divide-gray-50">
            {rows.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="text-primary-dark">{p.name}</span>
                <span className="flex items-center gap-1">
                  <b className="whitespace-nowrap">{p.price} ₾</b>
                  <Button small variant="ghost" onClick={() => setEditing(p)}>{t("edit")}</Button>
                  <ConfirmButton confirmLabel={t("confirmDelete")} onConfirm={() => run(async () => { await apiRequest("DELETE", `/prices/${p.id}`); refresh(); })}>{t("delete")}</ConfirmButton>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {editing && <PriceModal item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function PriceModal({ item, onClose, onSaved }: { item: PriceItem | null; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("features");
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [busy, setBusy] = useState(false);
  const { err, run } = useError();
  const save = async () => {
    setBusy(true);
    const ok = await run(() => apiRequest(item ? "PUT" : "POST", item ? `/prices/${item.id}` : "/prices", { name: name.trim(), price: price.trim() }));
    setBusy(false);
    if (ok) onSaved();
  };
  return (
    <Modal open title={item ? t("edit") : t("addPrice")} onClose={onClose}>
      <div className="space-y-3">
        {err && <Notice>{err}</Notice>}
        <Field label={t("service")}><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t("price")}><input className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <p className="text-xs text-foreground-muted/60">{t("priceHint")}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={save} disabled={busy || !name.trim() || !price.trim()}>{busy ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Staff (vet/vets.php, addvet.php, updatevet.php, delatevet.php) ─── */

export function StaffView() {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const { data, isLoading } = useStaff();
  const [editing, setEditing] = useState<StaffMember | "new" | null>(null);
  const { err, run } = useError();
  const me = getStoredSession()?.user?.id;
  const refresh = () => qc.invalidateQueries({ queryKey: ["clinic-staff"] });

  return (
    <div>
      <PageTitle actions={<Button onClick={() => setEditing("new")}>{t("addVet")}</Button>}>{t("staff")}</PageTitle>
      <p className="mb-3 text-xs text-foreground-muted/60">{t("removeHint")}</p>
      {err && <Notice>{err}</Notice>}
      {isLoading ? <p className="text-sm">{t("loading")}</p> : !data || data.length === 0 ? <Empty>{t("none")}</Empty> : (
        <Card>
          <ul className="divide-y divide-gray-50">
            {data.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p className="font-semibold text-primary-dark">{s.first_name}{String(s.id) === String(me) ? ` (${t("you")})` : ""}</p>
                  <p className="text-xs text-foreground-muted/60">{[s.email, s.phone, s.last_name].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="flex gap-1">
                  <Button small variant="ghost" onClick={() => setEditing(s)}>{t("edit")}</Button>
                  {String(s.id) !== String(me) && (
                    <ConfirmButton confirmLabel={t("confirmRemove")} onConfirm={() => run(async () => { await apiRequest("DELETE", `/staff/${s.id}`); refresh(); })}>{t("remove")}</ConfirmButton>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {editing && <StaffModal member={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function StaffModal({ member, onClose, onSaved }: { member: StaffMember | null; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("features");
  const [f, setF] = useState({
    first_name: member?.first_name ?? "", last_name: member?.last_name ?? "",
    email: member?.email ?? "", phone: member?.phone ?? "", password: "",
  });
  const [busy, setBusy] = useState(false);
  const { err, run } = useError();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim());
  const valid = f.first_name.trim() && emailOk && (member ? true : f.last_name.trim() && f.password.length >= 6);
  const save = async () => {
    setBusy(true);
    const body = member
      ? { first_name: f.first_name, last_name: f.last_name, email: f.email.trim(), phone: f.phone }
      : { ...f, email: f.email.trim() };
    const ok = await run(() => apiRequest(member ? "PUT" : "POST", member ? `/staff/${member.id}` : "/staff", body));
    setBusy(false);
    if (ok) onSaved();
  };
  return (
    <Modal open title={member ? t("edit") : t("addVet")} onClose={onClose}>
      <div className="space-y-3">
        {err && <Notice>{err}</Notice>}
        <Field label={t("firstName")}><input className={inputClass} value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></Field>
        <Field label={t("personalId")}><input className={inputClass} value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></Field>
        <Field label={t("email")}><input className={inputClass} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label={t("phone")}><input className={inputClass} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
        {!member && (
          <Field label={`${t("password")} — ${t("passwordHint")}`}>
            <input className={inputClass} type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </Field>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={save} disabled={busy || !valid}>{busy ? t("saving") : t("save")}</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── Appointments (vet/operationdate.php, voperationdate.php, delate.php) ─── */

export function AppointmentsView() {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const [from, setFrom] = useState(todayGeorgia());
  const [to, setTo] = useState(todayGeorgia());
  const { data, isLoading } = useAppointments(from, to);
  const { data: staff } = useStaff();
  const [booking, setBooking] = useState(false);
  const { err, run } = useError();
  const refresh = () => qc.invalidateQueries({ queryKey: ["appointments"] });
  const vetName = (id: string) => staff?.find((s) => String(s.id) === id)?.first_name ?? "";

  return (
    <div>
      <PageTitle actions={<Button onClick={() => setBooking(true)}>{t("bookAppointment")}</Button>}>{t("appointments")}</PageTitle>
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <Field label={t("from")}><input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label={t("to")}><input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          <Button variant="secondary" onClick={() => { setFrom(todayGeorgia()); setTo(todayGeorgia()); }}>{t("today")}</Button>
        </div>
      </Card>
      {err && <Notice>{err}</Notice>}
      {isLoading ? <p className="text-sm">{t("loading")}</p> : !data || data.data.length === 0 ? <Empty>{t("none")}</Empty> : (
        <Card>
          <ul className="divide-y divide-gray-50">
            {data.data.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p className="font-semibold text-primary-dark">{a.date} · {a.time || t("noTime")} · {a.tpname}</p>
                  <p className="text-xs text-foreground-muted/60">
                    {[a.pname, a.ownern, vetName(a.vetname), a.price ? `${a.price} ₾` : "", a.koment].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <ConfirmButton confirmLabel={t("confirmDelete")} onConfirm={() => run(async () => { await apiRequest("DELETE", `/appointments/${a.id}`); refresh(); qc.invalidateQueries({ queryKey: ["slots"] }); })}>{t("cancelAppointment")}</ConfirmButton>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {booking && <BookAppointmentModal onClose={() => setBooking(false)} onBooked={() => { setBooking(false); refresh(); }} />}
    </div>
  );
}

/* ─── Promo sign-ups (vet/promo.php) ─── */

export function PromoView() {
  const t = useTranslations("features");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const { data, isLoading } = usePromo(page, q);
  useEffect(() => {
    const id = setTimeout(() => { setQ(search); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);
  return (
    <div>
      <PageTitle>{t("promo")}</PageTitle>
      <p className="mb-3 text-xs text-foreground-muted/60">{t("promoHint")}</p>
      <input className={`${inputClass} mb-3`} placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      {isLoading ? <p className="text-sm">{t("loading")}</p> : !data || data.data.length === 0 ? <Empty>{t("none")}</Empty> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] uppercase text-foreground-muted/60">
                <th className="py-2">{t("name")}</th><th>{t("personalId")}</th><th>{t("phone")}</th><th>{t("email")}</th><th>{t("pets")}</th><th>{t("registered")}</th>
              </tr></thead>
              <tbody>
                {data.data.map((m) => (
                  <tr key={m.id} className="border-t border-gray-50">
                    <td className="py-2">{m.first_name}</td><td>{m.personal_id}</td><td>{m.phone}</td><td>{m.email}</td><td>{m.pet_count}</td><td>{m.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}

/* ─── My account (vet/acount.php) ─── */

interface Me { first_name: string; phone: string; address: string; city: string; email: string; company_name?: string }

export function AccountView() {
  const t = useTranslations("features");
  const { data: me, refetch } = useQuery<Me>({ queryKey: ["me"], queryFn: () => apiRequest<Me>("GET", "/auth/me") });
  const [f, setF] = useState({ first_name: "", phone: "", address: "", city: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { err, run } = useError();

  useEffect(() => {
    if (me) setF({ first_name: me.first_name ?? "", phone: me.phone ?? "", address: me.address ?? "", city: me.city ?? "" });
  }, [me]);

  const saveProfile = async () => {
    setBusy(true);
    setMsg(null);
    if (await run(() => apiRequest("PUT", "/auth/me", f))) {
      setMsg(t("saved"));
      refetch();
    }
    setBusy(false);
  };
  const changePassword = async () => {
    setBusy(true);
    setMsg(null);
    if (await run(() => apiRequest("POST", "/auth/change-password", pw))) {
      setMsg(t("passwordChanged"));
      setPw({ current_password: "", new_password: "" });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-4">
      <PageTitle>{t("account")}</PageTitle>
      {err && <Notice>{err}</Notice>}
      {msg && <Notice kind="success">{msg}</Notice>}
      <Card>
        <p className="mb-3 text-sm text-foreground-muted/70">{me?.email}{me?.company_name ? ` · ${me.company_name}` : ""}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("firstName")}><input className={inputClass} value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></Field>
          <Field label={t("phone")}><input className={inputClass} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label={t("address")}><input className={inputClass} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label={t("city")}><input className={inputClass} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></Field>
        </div>
        <div className="mt-3 flex justify-end"><Button onClick={saveProfile} disabled={busy || !f.first_name.trim()}>{t("save")}</Button></div>
      </Card>
      <Card>
        <h2 className="mb-3 text-sm font-bold text-primary-dark">{t("changePassword")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("currentPassword")}><input type="password" autoComplete="current-password" className={inputClass} value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
          <Field label={`${t("newPassword")} — ${t("passwordHint8")}`}><input type="password" autoComplete="new-password" className={inputClass} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></Field>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={changePassword} disabled={busy || !pw.current_password || pw.new_password.length < 8}>{t("changePassword")}</Button>
        </div>
      </Card>
    </div>
  );
}
