import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { localizeSpeciesValue, localizeSex } from "@/lib/utils/localize";
import ProcedureCards from "./procedure-cards";

const GO_API = process.env.NEXT_PUBLIC_API_URL!;

type PublicPetInfo = {
  id: string;
  name: string;
  species: string;
  breed: string;
  sex: string;
  chip: string;
  birth: string | null;
  color: string;
  castrated: boolean;
};

type ProcedureCategoryCount = {
  tp: number;
  name: string;
  count: number;
};

type PublicPetResponse = {
  pet: PublicPetInfo;
  categories: ProcedureCategoryCount[];
};

async function fetchPetProfile(id: string): Promise<PublicPetResponse | null> {
  try {
    const res = await fetch(`${GO_API}/api/public/pets/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const data = await fetchPetProfile(id);
  if (!data) {
    return { title: "VetApp" };
  }
  const species = localizeSpeciesValue(data.pet.species, locale);
  return {
    title: `${data.pet.name} — ${species} | VetApp`,
    description:
      locale === "ka"
        ? `${data.pet.name} - სამედიცინო პასპორტი`
        : `${data.pet.name} - Medical Passport`,
  };
}

export default async function PetProfilePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("petProfile");
  const data = await fetchPetProfile(id);

  if (!data) {
    notFound();
  }

  const { pet, categories } = data;
  const species = localizeSpeciesValue(pet.species, locale);
  const sex = localizeSex(pet.sex, locale);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#f4f9ff] to-[#eaf3fd]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-surface bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">VetApp</span>
          </div>
          <h1 className="text-sm font-semibold text-primary-dark">
            {t("title")}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {/* Pet Info Card */}
        <section className="rounded-2xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-2xl">
              {pet.species === "\u10EB\u10D0\u10E6\u10DA\u10D8"
                ? "\u{1F436}"
                : pet.species === "\u10D9\u10D0\u10E2\u10D0"
                  ? "\u{1F431}"
                  : "\u{1F43E}"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-dark">
                {pet.name}
              </h2>
              <p className="text-sm text-foreground-muted">
                {species} {pet.breed ? `\u2022 ${pet.breed}` : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoRow label={t("sex")} value={sex} />
            {pet.birth && <InfoRow label={t("birth")} value={pet.birth} />}
            {pet.color && <InfoRow label={t("color")} value={pet.color} />}
            {pet.chip && <InfoRow label={t("chip")} value={pet.chip} />}
            <InfoRow
              label={t("castrated")}
              value={pet.castrated ? t("yes") : t("no")}
            />
          </div>
        </section>

        {/* Medical Records */}
        <section className="mt-6">
          <h3 className="mb-4 text-lg font-bold text-primary-dark">
            {t("medicalRecords")}
          </h3>

          {categories.length === 0 ? (
            <p className="text-center text-sm text-foreground-muted">
              {t("noRecords")}
            </p>
          ) : (
            <ProcedureCards
              petId={id}
              categories={categories}
              locale={locale}
            />
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="text-xs text-foreground-muted">{t("poweredBy")}</p>
        </footer>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8fbfe] px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
        {label}
      </p>
      <p className="text-sm font-semibold text-primary-dark">{value}</p>
    </div>
  );
}
