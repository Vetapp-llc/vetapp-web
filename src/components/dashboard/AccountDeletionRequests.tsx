"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/request";
import { Button, Card, Empty, Notice, PageTitle } from "@/components/ui/kit";

type Request = { id: number; user_id: number; name: string; email: string; personal_id: string; requested_at: string; due_at: string };
const checks = ["legacy_erased", "new_data_erased", "sessions_revoked", "confirmation_sent"] as const;

function useRequests() {
  return useQuery({ queryKey: ["account-deletion-requests"], queryFn: () => apiRequest<{ requests: Request[] }>("GET", "/admin/account-deletion-requests"), refetchInterval: 60_000 });
}

export function AccountDeletionNotice({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations("deletionRequests");
  const { data } = useRequests();
  if (!data?.requests.length) return null;
  return <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
    <p>{t("pendingCount", { count: data.requests.length })}</p><Button small variant="secondary" onClick={onOpen}>{t("view")}</Button>
  </div>;
}

function RequestCard({ item }: { item: Request }) {
  const t = useTranslations("deletionRequests");
  const locale = useLocale();
  const qc = useQueryClient();
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const due = new Date(item.due_at);
  const date = (value: string) => new Date(value).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
  const complete = async () => {
    setBusy(true); setError("");
    try {
      await apiRequest("POST", `/admin/account-deletion-requests/${item.id}/complete`, confirmed);
      await qc.invalidateQueries({ queryKey: ["account-deletion-requests"] });
    } catch (err) { setError(err instanceof Error ? err.message : t("error")); }
    finally { setBusy(false); }
  };
  return <Card>
    <div className="flex flex-wrap justify-between gap-3">
      <div><h3 className="font-bold text-primary-dark">#{item.id} · {item.name}</h3><p className="mt-1 break-all text-sm">{item.email}</p><p className="mt-1 text-xs text-foreground-muted">{t("identity")}: {item.personal_id || "—"} · {t("account")}: {item.user_id}</p></div>
      <div className="text-sm"><p className={due.getTime() < Date.now() ? "font-bold text-red-700" : "font-semibold text-primary-dark"}>{t("due")}: {date(item.due_at)}</p><p className="mt-1 text-xs text-foreground-muted">{t("requested")}: {date(item.requested_at)}</p></div>
    </div>
    <fieldset disabled={busy} className="mt-5 space-y-3 border-t border-gray-100 pt-4">
      <legend className="sr-only">{t("checks")}</legend>
      {checks.map(key => <label key={key} className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={!!confirmed[key]} onChange={e => setConfirmed({ ...confirmed, [key]: e.target.checked })} className="mt-1 h-4 w-4 shrink-0" />{t(key)}</label>)}
    </fieldset>
    {error && <div className="mt-3"><Notice>{error}</Notice></div>}
    <div className="mt-4"><Button disabled={busy || !checks.every(key => confirmed[key])} onClick={complete}>{busy ? t("saving") : t("complete")}</Button></div>
  </Card>;
}

export function AccountDeletionRequests() {
  const t = useTranslations("deletionRequests");
  const { data, isLoading, error, refetch } = useRequests();
  return <div className="space-y-4">
    <PageTitle>{t("title")}</PageTitle>
    <p className="text-sm leading-6 text-foreground-muted">{t("instructions")}</p>
    <Notice>{t("notice")}</Notice>
    {error && <><Notice>{error.message}</Notice><Button onClick={() => refetch()}>{t("retry")}</Button></>}
    {isLoading ? <p>{t("loading")}</p> : data?.requests.length ? data.requests.map(item => <RequestCard key={item.id} item={item} />) : !error && <Empty>{t("empty")}</Empty>}
  </div>;
}
