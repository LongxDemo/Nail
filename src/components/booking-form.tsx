"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { createBooking, fetchAvailableSlots } from "@/app/[locale]/booking/actions";
import { localize, formatPrice } from "@/lib/format";

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export interface BookingService {
  id: string;
  nameEn: string;
  nameKm: string;
  durationMinutes: number;
  priceCents: number;
}

export interface BookingTechnician {
  id: string;
  name: string;
}

export function BookingForm({
  designId,
  services,
  technicians,
}: {
  designId?: string;
  services: BookingService[];
  technicians: BookingTechnician[];
}) {
  const t = useTranslations("Booking");
  const locale = useLocale();
  const router = useRouter();

  const [serviceId, setServiceId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    fetchAvailableSlots(date, serviceId, technicianId || undefined).then((result) => {
      if (!cancelled) {
        setSlots(result);
        setLoadingSlots(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, serviceId, technicianId]);

  function handleServiceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setServiceId(e.target.value);
    setSelectedTime(null);
    if (e.target.value) setLoadingSlots(true);
  }

  function handleTechnicianChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTechnicianId(e.target.value);
    setSelectedTime(null);
    if (serviceId) setLoadingSlots(true);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDate(e.target.value);
    setSelectedTime(null);
    if (serviceId) setLoadingSlots(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime || !serviceId) return;
    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        name,
        phone,
        date,
        startTime: selectedTime,
        serviceId,
        designId,
        technicianId: technicianId || undefined,
        note: note || undefined,
      });
      if ("error" in result) {
        setError(result.error === "slot_unavailable" ? "errorSlotUnavailable" : "errorGeneric");
        if (result.error === "slot_unavailable") {
          fetchAvailableSlots(date, serviceId, technicianId || undefined).then(setSlots);
          setSelectedTime(null);
        }
        return;
      }
      router.push(`/booking/confirmation/${result.id}`);
    });
  }

  const minDate = todayIso();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("serviceLabel")}
        </label>
        <select
          value={serviceId}
          onChange={handleServiceChange}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
          required
        >
          <option value="" disabled>
            {t("servicePlaceholder")}
          </option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {localize(locale, s.nameEn, s.nameKm)} · {s.durationMinutes} min ·{" "}
              {formatPrice(s.priceCents)}
            </option>
          ))}
        </select>
      </div>

      {technicians.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground/80">
            {t("technicianLabel")}
          </label>
          <select
            value={technicianId}
            onChange={handleTechnicianChange}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
          >
            <option value="">{t("technicianAny")}</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("dateLabel")}
        </label>
        <input
          type="date"
          value={date}
          min={minDate}
          onChange={handleDateChange}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("timeLabel")}
        </label>
        {!serviceId ? (
          <p className="text-sm text-foreground/60">{t("chooseServiceFirst")}</p>
        ) : loadingSlots ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
        ) : slots.length === 0 ? (
          <p className="text-sm text-foreground/60">{t("noSlots")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  slot === selectedTime
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-border bg-surface text-foreground/80 hover:border-brand-300"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("nameLabel")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("phoneLabel")}
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("noteLabel")}
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
        />
      </div>

      {error && <p className="text-sm text-brand-700">{t(error as "errorGeneric")}</p>}

      <button
        type="submit"
        disabled={!selectedTime || isPending}
        className="flex items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
