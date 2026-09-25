"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/request";
import { useMembers, useTransactions, useSmsPreview } from "@/lib/hooks/useClinicFeatures";
import { Pagination } from "../Pagination";
import { Button, Card, ConfirmButton, Empty, Notice, PageTitle, inputClass } from "@/components/ui/kit";

/* ─── Accounts (superadmin/owners.php, dep.php, delateowner.php, delateadmin.php) ─── */

export function MembersPanel() {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const [group, setGroup] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const { data, isLoading } = useMembers(group, page, q);

  useEffect(() => {
    const id = setTimeout(() => { setQ(search); setPage(1); }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const disable = async (id: number) => {
    setErr(null);
    try {
      await apiRequest("DELETE", `/admin/members/${id}`);
      qc.invalidateQueries({ queryKey: ["admin-members"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    }
  };

  const groups: [number, string][] = [[1, t("owners")], [2, t("vets")], [3, t("departments")], [4, t("admins")]];
  return (
    <div>
      <PageTitle>{t("members")}</PageTitle>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {groups.map(([g, label]) => (
          <button key={g} onClick={() => { setGroup(g); setPage(1); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${group === g ? "bg-primary text-white" : "bg-gray-100 text-foreground-muted"}`}>
            {label}
          </button>
        ))}
      </div>
      <input className={`${inputClass} mb-2`} placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} />
      <p className="mb-3 text-xs text-foreground-muted/60">{t("disableHint")}</p>
      {err && <Notice>{err}</Notice>}
      {isLoading ? <p className="text-sm">{t("loading")}</p> : !data || data.data.length === 0 ? <Empty>{t("none")}</Empty> : (
        <Card>
          <p className="mb-2 text-xs text-foreground-muted/60">{data.total}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] uppercase text-foreground-muted/60">
                <th className="py-2">{t("name")}</th><th>{t("personalId")}</th><th>{t("email")}</th><th>{t("phone")}</th>
                <th>{group === 1 ? t("pets") : t("clinic")}</th><th>{t("lastLogin")}</th><th />
              </tr></thead>
              <tbody>
                {data.data.map((m) => (
                  <tr key={m.id} className="border-t border-gray-50">
                    <td className="py-2">{m.first_name}</td>
                    <td>{m.personal_id}</td>
                    <td>{m.email}</td>
                    <td>{m.phone}</td>
                    <td>{group === 1 ? m.pet_count : [m.company_name, m.zip].filter(Boolean).join(" · ")}</td>
                    <td className="whitespace-nowrap">{m.last_login ?? ""}</td>
                    <td className="text-right"><ConfirmButton confirmLabel={t("confirmDisable")} onConfirm={() => disable(m.id)}>{t("disable")}</ConfirmButton></td>
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

/* ─── Subscription payments (superadmin/trans.php) ─── */

export function TransactionsPanel() {
  const t = useTranslations("features");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTransactions(page);
  return (
    <div>
      <PageTitle>{t("transactions")}</PageTitle>
      {isLoading ? <p className="text-sm">{t("loading")}</p> : !data || data.data.length === 0 ? <Empty>{t("none")}</Empty> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] uppercase text-foreground-muted/60">
                <th className="py-2">{t("date")}</th><th>{t("patient")}</th><th>{t("amount")}</th><th>{t("status")}</th><th>{t("provider")}</th><th>{t("order")}</th>
              </tr></thead>
              <tbody>
                {data.data.map((x) => (
                  <tr key={x.id} className="border-t border-gray-50">
                    <td className="py-2 whitespace-nowrap">{x.created_at ?? ""}</td>
                    <td>{x.pet_name || x.pet_id}</td>
                    <td className="whitespace-nowrap">{x.price} {x.currency}</td>
                    <td><span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${x.status === "success" ? "bg-emerald-50 text-emerald-700" : x.status === "failed" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>{x.status}</span></td>
                    <td>{x.provider}</td>
                    <td className="max-w-[12rem] truncate text-xs text-foreground-muted/70">{x.order_id}</td>
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

/* ─── SMS reminders (sms/index.php) ─── */

export function SmsPanel() {
  const t = useTranslations("features");
  const qc = useQueryClient();
  const { data, isLoading, error } = useSmsPreview();
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const send = async (kind: string) => {
    setBusy(kind);
    setErr(null);
    setResult(null);
    try {
      const r = await apiRequest<{ expired_sent: number; birthdays_sent: number; procedures_sent: number; errors: number; skipped: string[] }>(
        "POST", `/notifications/sms/reminders?kinds=${kind}`,
      );
      setResult(t("smsSent", { sent: r.expired_sent + r.birthdays_sent + r.procedures_sent, errors: r.errors }));
      qc.invalidateQueries({ queryKey: ["sms-preview"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(null);
    }
  };

  const kinds: [string, string][] = [["expired", t("smsExpired")], ["birthday", t("smsBirthday")], ["procedure", t("smsProcedure")]];
  return (
    <div>
      <PageTitle>{t("sms")}</PageTitle>
      <p className="mb-3 text-xs text-foreground-muted/60">{t("smsHint")}</p>
      {(err || error) && <Notice>{err ?? error?.message}</Notice>}
      {result && <Notice kind="success">{result}</Notice>}
      {isLoading || !data ? <p className="text-sm">{t("loading")}</p> : (
        <div className="mt-3 space-y-3">
          {kinds.map(([kind, label]) => {
            const sent = data.sent_today[kind];
            return (
              <Card key={kind}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-primary-dark">{label}</p>
                    <p className="text-xs text-foreground-muted/60">{data.kinds[kind] ?? 0} {t("recipients")} · {data.date}</p>
                  </div>
                  {sent !== undefined ? (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{t("sentToday")}: {sent}</span>
                  ) : (
                    <ConfirmButton confirmLabel={t("confirmSend")} disabled={busy !== null || !data.kinds[kind]} onConfirm={() => send(kind)}>
                      {busy === kind ? t("saving") : t("send")}
                    </ConfirmButton>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-gray-50 p-2 text-xs text-foreground-muted">{data.texts[kind]}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("features");
  const tabs: [string, string][] = [["stats", "📊"], ["members", t("members")], ["transactions", t("transactions")], ["sms", t("sms")]];
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {tabs.map(([id, label]) => (
        <Button key={id} small variant={value === id ? "primary" : "secondary"} onClick={() => onChange(id)}>{label}</Button>
      ))}
    </div>
  );
}
