"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Star } from "lucide-react";
import { findReviewableBookings, submitReview } from "@/app/[locale]/reviews/actions";

type Booking = { id: string; date: string; startTime: string; designId: string | null };

export function LeaveReviewForm() {
  const t = useTranslations("Reviews");

  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFindBookings(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await findReviewableBookings(phone);
      setBookings(result);
    });
  }

  function handleSubmitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBookingId) return;
    const formData = new FormData(e.currentTarget);
    formData.set("bookingId", selectedBookingId);
    formData.set("phone", phone);
    formData.set("rating", String(rating));
    startTransition(async () => {
      const result = await submitReview(formData);
      if ("id" in result) setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 text-center">
        <p className="font-display text-xl text-brand-800">{t("thankYouTitle")}</p>
        <p className="mt-1 text-sm text-brand-700">{t("thankYouBody")}</p>
      </div>
    );
  }

  if (bookings === null) {
    return (
      <form onSubmit={handleFindBookings} className="flex gap-2">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phoneLabel")}
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("findBookingsSubmit")}
        </button>
      </form>
    );
  }

  if (bookings.length === 0) {
    return <p className="text-foreground/60">{t("noEligibleBookings")}</p>;
  }

  return (
    <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("chooseVisit")}
        </label>
        <select
          value={selectedBookingId ?? ""}
          onChange={(e) => setSelectedBookingId(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
          required
        >
          <option value="" disabled>
            {t("chooseVisit")}
          </option>
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.date} · {b.startTime}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("ratingLabel")}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} stars`}
            >
              <Star
                className={`h-7 w-7 ${
                  value <= rating ? "fill-brand-500 text-brand-500" : "text-border"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("commentLabel")}
        </label>
        <textarea
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground/80">
          {t("photosLabel")}
        </label>
        <input
          type="file"
          name="photos"
          accept="image/*"
          multiple
          className="block w-full text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={!selectedBookingId || isPending}
        className="flex items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? t("submitting") : t("submitReview")}
      </button>
    </form>
  );
}
