import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin, Phone, Mail } from "lucide-react";
import { getDb } from "@/db/client";
import { listWorkingHours } from "@/db/queries";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("About");
  const db = await getDb();
  const hours = await listWorkingHours(db);

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(siteConfig.address)}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-3xl text-brand-900">{t("title")}</h1>
      <p className="mt-2 text-foreground/70">{t("intro")}</p>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground/80">{t("hoursTitle")}</h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {hours.map((row) => (
            <div key={row.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-foreground/80">{t(`days.${row.dayOfWeek}`)}</span>
              <span className={row.isClosed ? "text-foreground/40" : "text-foreground/70"}>
                {row.isClosed ? t("closed") : `${row.openTime} – ${row.closeTime}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-foreground/80">{t("contactTitle")}</h2>
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground/80 hover:text-brand-600"
          >
            <MapPin className="h-5 w-5 shrink-0 text-brand-500" />
            <span>
              {siteConfig.address}
              <span className="block text-xs text-brand-600 underline underline-offset-2">
                {t("viewOnMap")}
              </span>
            </span>
          </a>
          <a
            href={`tel:${siteConfig.phone}`}
            className="flex items-center gap-3 text-foreground/80 hover:text-brand-600"
          >
            <Phone className="h-5 w-5 shrink-0 text-brand-500" />
            {siteConfig.phone}
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="flex items-center gap-3 text-foreground/80 hover:text-brand-600"
          >
            <Mail className="h-5 w-5 shrink-0 text-brand-500" />
            {siteConfig.email}
          </a>
        </div>
      </section>
    </div>
  );
}
