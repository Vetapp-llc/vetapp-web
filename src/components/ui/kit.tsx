"use client";

// Small shared UI kit for the clinic and admin screens, in the dashboard's
// existing visual language (rounded-xl, primary / primary-dark palette).

import { useEffect, useState, type ReactNode } from "react";
import { useBackClose } from "@/lib/hooks/useBackClose";

export const inputClass =
  "mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-50";
export const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/60";

export function Button({
  children, onClick, variant = "primary", disabled, type = "button", small, title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
  small?: boolean;
  title?: string;
}) {
  const size = small ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm";
  const styles = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "border border-gray-200 bg-white text-primary-dark hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-foreground-muted hover:bg-gray-100",
  }[variant];
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${size} ${styles}`}
    >
      {children}
    </button>
  );
}

/**
 * A destructive action that needs a second, explicit click (no blocking
 * browser dialogs). Once armed it shows Confirm and Cancel and stays armed
 * until one is chosen or Escape is pressed. It used to disarm itself after
 * four seconds, so a slower second click silently re-armed it instead of
 * acting — every delete looked like it did nothing.
 */
export function ConfirmButton({
  children, confirmLabel, onConfirm, disabled, small = true, cancelLabel = "×",
}: {
  children: ReactNode;
  confirmLabel: ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
  small?: boolean;
  cancelLabel?: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setArmed(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [armed]);
  if (!armed) {
    return (
      <Button variant="ghost" small={small} disabled={disabled} onClick={() => setArmed(true)}>
        {children}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Button variant="danger" small={small} disabled={disabled} onClick={() => { setArmed(false); onConfirm(); }}>
        {confirmLabel}
      </Button>
      <Button variant="secondary" small={small} onClick={() => setArmed(false)} title="Cancel">
        {cancelLabel}
      </Button>
    </span>
  );
}

export function Field({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  open, title, onClose, children, wide, zIndex = "z-[70]",
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  zIndex?: string;
}) {
  useBackClose(open, onClose);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-primary-dark/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.12)]`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <h2 className="text-base font-bold text-primary-dark">{title}</h2>
          <button onClick={onClose} aria-label="close" className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-foreground-muted hover:bg-gray-200 cursor-pointer">×</button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Notice({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  if (!children) return null;
  const s = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  }[kind];
  return <div className={`rounded-xl border px-4 py-2.5 text-sm ${s}`}>{children}</div>;
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center text-sm text-foreground-muted/60">{children}</div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${className}`}>{children}</div>;
}

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-primary-dark">{children}</h1>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Paid / unpaid badge for a procedure's `phone` flag. */
export function PaidBadge({ paid, paidLabel, unpaidLabel }: { paid: boolean; paidLabel: string; unpaidLabel: string }) {
  return paid ? (
    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{paidLabel}</span>
  ) : (
    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">{unpaidLabel}</span>
  );
}
