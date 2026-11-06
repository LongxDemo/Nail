import { getTranslations, setRequestLocale } from "next-intl/server";
import { localize, formatPrice } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { lookupBookingsByPhone, cancelBookingFormAction } from "@/app/[locale]/booking/actions";

export const dynamic = "force-dynamic";

const STATUS_KEY = {
  pending: "statusPending",
  confirmed: "statusConfirmed",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
  no_show: "statusNoShow",
} as const;

export default async function BookingLookupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { locale } = await params;
  const { phone } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Booking");
  const results = phone ? await lookupBookingsByPhone(phone) : [];

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-3xl text-brand-900">{t("lookupTitle")}</h1>
      <p className="mt-1 text-foreground/70">{t("lookupSubtitle")}</p>

      <form method="get" className="mt-5 flex gap-2">
        <input
          type="tel"
          name="phone"
          defaultValue={phone}
          placeholder={t("phoneLabel")}
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5"
          required
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600"
        >
          {t("lookupSubmit")}
        </button>
      </form>

      {phone && (
        <div className="mt-6 space-y-3">
          {results.length === 0 ? (
            <p className="text-foreground/60">{t("lookupEmpty")}</p>
          ) : (
            results.map((booking) => {
              const activeStatus = booking.status === "pending" || booking.status === "confirmed";
              const showActions = activeStatus && booking.canModify;
              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground/90">
                        {booking.date} · {booking.startTime}
                      </p>
                      <p className="text-sm text-foreground/70">
                        {localize(locale, booking.serviceNameEn, booking.serviceNameKm)} ·{" "}
                        {formatPrice(booking.servicePriceCents)}
                      </p>
                      {booking.technicianName && (
                        <p className="text-sm text-foreground/60">{booking.technicianName}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                      {t(STATUS_KEY[booking.status])}
                    </span>
                  </div>
                  {activeStatus && !booking.canModify && (
                    <p className="mt-3 text-xs text-foreground/50">{t("modifyCutoffNotice")}</p>
                  )}
                  {showActions && (
                    <div className="mt-3 flex items-center gap-4">
                      <Link
                        href={`/booking/lookup/${booking.id}/reschedule?phone=${encodeURIComponent(phone)}`}
                        className="text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-800"
                      >
                        {t("changeButton")}
                      </Link>
                      <form action={cancelBookingFormAction.bind(null, booking.id, phone)}>
                        <button
                          type="submit"
                          className="text-sm font-medium text-brand-600 underline underline-offset-2 hover:text-brand-800"
                        >
                          {t("cancelButton")}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
