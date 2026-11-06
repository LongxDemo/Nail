import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/db/client";
import { getDesignById, listActiveServices, listActiveTechnicians } from "@/db/queries";
import { localize, formatPrice } from "@/lib/format";
import { BookingForm } from "@/components/booking-form";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ designId?: string }>;
}) {
  const { locale } = await params;
  const { designId } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Booking");
  const db = await getDb();

  const [services, technicians] = await Promise.all([
    listActiveServices(db),
    listActiveTechnicians(db),
  ]);

  let selectedDesign: { name: string; priceCents: number } | null = null;
  if (designId) {
    const result = await getDesignById(db, designId);
    if (result) {
      selectedDesign = {
        name: localize(locale, result.design.nameEn, result.design.nameKm),
        priceCents: result.design.priceCents,
      };
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-3xl text-brand-900">{t("title")}</h1>
      <p className="mt-1 text-foreground/70">{t("subtitle")}</p>

      {selectedDesign && (
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {t("selectedDesign")}
          </p>
          <p className="text-foreground/90">
            {selectedDesign.name} · {formatPrice(selectedDesign.priceCents)}
          </p>
        </div>
      )}

      <div className="mt-6">
        <BookingForm
          designId={designId}
          services={services.map((s) => ({
            id: s.id,
            nameEn: s.nameEn,
            nameKm: s.nameKm,
            durationMinutes: s.durationMinutes,
            priceCents: s.priceCents,
          }))}
          technicians={technicians.map((tech) => ({ id: tech.id, name: tech.name }))}
        />
      </div>
    </div>
  );
}
