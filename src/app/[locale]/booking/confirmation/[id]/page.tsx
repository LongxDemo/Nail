import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDb } from "@/db/client";
import { bookings, customers, designs, services, technicians } from "@/db/schema";
import { localize, formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Booking");

  const db = await getDb();
  const [row] = await db
    .select({
      date: bookings.date,
      startTime: bookings.startTime,
      customerName: customers.name,
      designNameEn: designs.nameEn,
      designNameKm: designs.nameKm,
      serviceNameEn: services.nameEn,
      serviceNameKm: services.nameKm,
      serviceDurationMinutes: services.durationMinutes,
      servicePriceCents: services.priceCents,
      technicianName: technicians.name,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(designs, eq(bookings.designId, designs.id))
    .leftJoin(technicians, eq(bookings.technicianId, technicians.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) notFound();

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-brand-500" />
      <h1 className="font-display mt-4 text-3xl text-brand-900">{t("confirmationTitle")}</h1>
      <p className="mt-1 text-foreground/70">{t("confirmationSubtitle")}</p>

      <div className="mt-6 space-y-2 rounded-2xl border border-border bg-surface p-5 text-left">
        <p>
          <span className="font-medium text-foreground/60">{t("dateLabel")}: </span>
          {row.date} {row.startTime}
        </p>
        <p>
          <span className="font-medium text-foreground/60">{t("nameLabel")}: </span>
          {row.customerName}
        </p>
        <p>
          <span className="font-medium text-foreground/60">{t("confirmationService")}: </span>
          {localize(locale, row.serviceNameEn, row.serviceNameKm)} · {row.serviceDurationMinutes} min ·{" "}
          {formatPrice(row.servicePriceCents)}
        </p>
        {row.technicianName && (
          <p>
            <span className="font-medium text-foreground/60">{t("confirmationTechnician")}: </span>
            {row.technicianName}
          </p>
        )}
        {row.designNameEn && (
          <p>
            <span className="font-medium text-foreground/60">{t("selectedDesign")}: </span>
            {localize(locale, row.designNameEn, row.designNameKm)}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/booking/lookup"
          className="flex-1 rounded-full border border-brand-300 px-6 py-3 text-center font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          {t("viewMyBookings")}
        </Link>
        <Link
          href="/"
          className="flex-1 rounded-full bg-brand-500 px-6 py-3 text-center font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
        >
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
