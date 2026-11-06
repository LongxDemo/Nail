import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDb } from "@/db/client";
import { localize } from "@/lib/format";
import { getBookingForReschedule } from "@/app/[locale]/booking/actions";
import { listActiveTechnicians } from "@/db/queries";
import { RescheduleForm } from "@/components/reschedule-form";

export const dynamic = "force-dynamic";

export default async function BookingReschedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { locale, id } = await params;
  const { phone } = await searchParams;
  setRequestLocale(locale);

  if (!phone) redirect("/booking/lookup");

  const t = await getTranslations("Booking");
  const booking = await getBookingForReschedule(id, phone);
  if (!booking) notFound();
  if (!booking.canModify) redirect(`/booking/lookup?phone=${encodeURIComponent(phone)}`);

  const db = await getDb();
  const technicians = await listActiveTechnicians(db);

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-3xl text-brand-900">{t("changeTitle")}</h1>
      <p className="mt-1 text-foreground/70">{t("changeSubtitle")}</p>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <p className="font-medium text-foreground/90">
          {localize(locale, booking.serviceNameEn, booking.serviceNameKm)} ·{" "}
          {booking.serviceDurationMinutes} min
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          {t("dateLabel")}: {booking.date} {booking.startTime}
        </p>
      </div>

      <div className="mt-6">
        <RescheduleForm
          bookingId={booking.id}
          phone={phone}
          serviceId={booking.serviceId}
          initialDate={booking.date}
          initialStartTime={booking.startTime}
          initialTechnicianId={booking.technicianId}
          technicians={technicians}
        />
      </div>
    </div>
  );
}
