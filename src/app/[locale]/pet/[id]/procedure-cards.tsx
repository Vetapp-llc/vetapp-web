"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type ProcedureCategoryCount = {
  tp: number;
  name: string;
  count: number;
};

type ProcedureItem = {
  id: string;
  date: string;
  nextDate?: string;
  name?: string;
  diagnosis?: string;
  notes?: string;
  vetName?: string;
};

// Emoji mapping for procedure types
const CATEGORY_EMOJI: Record<number, string> = {
  1: "\u{1F489}",
  101: "\u{1F489}",
  2: "\u{1F9EA}",
  3: "\u{1FA7A}",
  4: "\u{1F99F}",
  5: "\u{1FA78}",
  6: "\u{1F9B7}",
  7: "\u{1F4F7}",
  8: "\u{1F50D}",
  9: "\u{2764}\u{FE0F}",
  10: "\u{1F52C}",
  100: "\u{2702}\u{FE0F}",
  102: "\u{1F4DF}",
  103: "\u{1F54A}\u{FE0F}",
  104: "\u{1F52C}",
  108: "\u{1F4CB}",
  109: "\u{1F9F0}",
  999: "\u{26A0}\u{FE0F}",
};

const CATEGORY_NAME_EN: Record<number, string> = {
  1: "Vaccination",
  101: "Rabies Vaccine",
  2: "Test / Analysis",
  3: "Deworming",
  4: "Ectoparasite Treatment",
  5: "Surgery",
  6: "Dental",
  7: "X-Ray",
  8: "Ultrasound",
  9: "ECG",
  10: "Endoscopy",
  100: "Sterilization",
  102: "Microchipping",
  103: "Euthanasia",
  104: "Laboratory",
  108: "Consultation",
  109: "Manipulation",
  999: "Allergy / Disease",
};

export default function ProcedureCards({
  petId,
  categories,
  locale,
}: {
  petId: string;
  categories: ProcedureCategoryCount[];
  locale: string;
}) {
  const t = useTranslations("petProfile");
  const [expandedTp, setExpandedTp] = useState<number | null>(null);
  const [procedures, setProcedures] = useState<ProcedureItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCardClick = async (tp: number) => {
    if (expandedTp === tp) {
      setExpandedTp(null);
      return;
    }

    setExpandedTp(tp);
    setLoading(true);
    try {
      const res = await fetch(`/api/public/pets/${petId}/procedures?tp=${tp}`);
      if (res.ok) {
        const data = await res.json();
        setProcedures(data);
      } else {
        setProcedures([]);
      }
    } catch {
      setProcedures([]);
    }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categories.map((cat) => (
        <div key={cat.tp}>
          <button
            onClick={() => handleCardClick(cat.tp)}
            className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all hover:shadow-md ${
              expandedTp === cat.tp
                ? "ring-2 ring-primary"
                : ""
            }`}
          >
            <span className="text-2xl">
              {CATEGORY_EMOJI[cat.tp] ?? "\u{1F4C4}"}
            </span>
            <span className="text-center text-xs font-semibold text-primary-dark">
              {locale === "en"
                ? CATEGORY_NAME_EN[cat.tp] ?? cat.name
                : cat.name}
            </span>
            <span className="rounded-full bg-primary-light px-3 py-0.5 text-xs font-bold text-primary">
              {t("records", { count: cat.count })}
            </span>
          </button>

          {/* Expanded procedure list */}
          {expandedTp === cat.tp && (
            <div className="col-span-full mt-2 rounded-xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] animate-fade-in">
              {loading ? (
                <p className="text-center text-sm text-foreground-muted">
                  {locale === "ka" ? "იტვირთება..." : "Loading..."}
                </p>
              ) : procedures.length === 0 ? (
                <p className="text-center text-sm text-foreground-muted">
                  {t("noRecords")}
                </p>
              ) : (
                <div className="space-y-3">
                  {procedures.map((proc) => (
                    <div
                      key={proc.id}
                      className="rounded-lg border border-surface p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground-muted">
                          {proc.date}
                        </span>
                        {proc.vetName && (
                          <span className="text-xs text-foreground-muted">
                            {proc.vetName}
                          </span>
                        )}
                      </div>
                      {proc.name && (
                        <p className="mt-1 text-sm font-semibold text-primary-dark">
                          {proc.name}
                        </p>
                      )}
                      {proc.diagnosis && (
                        <p className="mt-1 text-sm text-primary-dark">
                          {locale === "ka" ? "დიაგნოზი" : "Diagnosis"}:{" "}
                          {proc.diagnosis}
                        </p>
                      )}
                      {proc.notes && (
                        <p className="mt-1 text-xs text-foreground-muted">
                          {proc.notes}
                        </p>
                      )}
                      {proc.nextDate && (
                        <p className="mt-1 text-xs text-primary">
                          {locale === "ka" ? "შემდეგი" : "Next"}: {proc.nextDate}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
