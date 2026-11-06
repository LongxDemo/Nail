"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { fetchAvailableSlots, rescheduleBooking } from "@/app/[locale]/booking/actions";

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

export interface RescheduleTechnician {
  id: string;
  name: string;
}

export function RescheduleForm({
  bookingId,
  phone,
  serviceId,
  initialDate,
  initialStartTime,
  initialTechnicianId,
  technicians,
}: {
  bookingId: string;
  phone: string;
  serviceId: string;
  initialDate: string;
  initialStartTime: string;
  initialTechnicianId: string | null;
  technicians: RescheduleTechnician[];
}) {
  const t = useTranslations("Booking");
  const router = useRouter();

  const [technicianId, setTechnicianId] = useState(initialTechnicianId || "");
  const [date, setDate] = useState(initialDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialStartTime);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    fetchAvailableSlots(date, serviceId, technicianId || undefined, bookingId).then((result) => {
      if (!cancelled) {
        setSlots(result);
        setLoadingSlots(false);
        setSelectedTime((prev) => (prev && result.includes(prev) ? prev : null));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, serviceId, technicianId, bookingId]);

  function handleTechnicianChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setTechnicianId(e.target.value);
    setSelectedTime(null);
    setLoadingSlots(true);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDate(e.target.value);
    setSelectedTime(null);
    setLoadingSlots(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTime) return;
    setError(null);
    startTransition(async () => {
      const result = await rescheduleBooking(bookingId, phone, {
        date,
        startTime: selectedTime,
        technicianId: technicianId || undefined,
      });
      if ("error" in result) {
        setError(result.error === "slot_unavailable" ? "errorSlotUnavailable" : "errorGeneric");
        if (result.error === "slot_unavailable") {
          fetchAvailableSlots(date, serviceId, technicianId || undefined, bookingId).then(setSlots);
          setSelectedTime(null);
        }
        return;
      }
      router.push(`/booking/lookup?phone=${encodeURIComponent(phone)}`);
    });
  }

  const minDate = todayIso();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        {loadingSlots ? (
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

      {error && <p className="text-sm text-brand-700">{t(error as "errorGeneric")}</p>}

      <button
        type="submit"
        disabled={!selectedTime || isPending}
        className="flex items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? t("submitting") : t("changeSubmit")}
      </button>
    </form>
  );
}
