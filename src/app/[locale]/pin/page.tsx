"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";

export default function PinLookupPage() {
  const t = useTranslations("petProfile");
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);
    setError("");

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (text.length === 4) {
      setDigits(text.split(""));
      inputs.current[3]?.focus();
    }
  };

  const handleSubmit = async () => {
    const code = digits.join("");
    if (code.length !== 4) {
      setError(t("pinInvalid"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/public/pets/code/${code}`);
      if (!res.ok) {
        setError(t("pinNotFound"));
        setLoading(false);
        return;
      }
      const data = await res.json();
      router.push(`/${locale}/pet/${data.pet.id}`);
    } catch {
      setError(t("pinNotFound"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f4f9ff] to-[#eaf3fd]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-primary">VetApp</span>
          <h1 className="text-sm font-semibold text-primary-dark">
            {t("pinLookup")}
          </h1>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <div className="w-full rounded-2xl bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-3xl">
              🔑
            </div>
          </div>

          <h2 className="mb-2 text-center text-lg font-bold text-primary-dark">
            {t("pinLookup")}
          </h2>
          <p className="mb-8 text-center text-sm text-foreground-muted">
            {t("pinDescription")}
          </p>

          {/* 4-digit input */}
          <div className="mb-6 flex justify-center gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 w-14 rounded-xl border-2 border-surface bg-[#f8fbfe] text-center text-2xl font-bold text-primary-dark outline-none transition-colors focus:border-primary focus:bg-white"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="mb-4 text-center text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || digits.some((d) => !d)}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("pinSearching") : t("pinSearch")}
          </button>
        </div>
      </main>
    </div>
  );
}
