import { useTranslations } from "next-intl";

export default function DashboardPage() {
  const t = useTranslations("common");

  return (
    <div>
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
      <p className="mt-2 text-gray-600">Dashboard content placeholder</p>
    </div>
  );
}
