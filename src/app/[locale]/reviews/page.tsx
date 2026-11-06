import { getTranslations, setRequestLocale } from "next-intl/server";
import { Star } from "lucide-react";
import { getDb } from "@/db/client";
import { listApprovedReviews } from "@/db/queries";
import { LeaveReviewForm } from "@/components/leave-review-form";

export const dynamic = "force-dynamic";

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Reviews");
  const db = await getDb();
  const reviews = await listApprovedReviews(db);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl text-brand-900">{t("title")}</h1>
      <p className="mt-1 text-foreground/70">{t("subtitle")}</p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display mb-3 text-xl text-brand-900">{t("leaveReviewTitle")}</h2>
        <LeaveReviewForm />
      </div>

      <div className="mt-8 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-foreground/60">{t("noReviews")}</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground/90">{review.customerName}</p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "fill-brand-500 text-brand-500" : "text-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="mt-2 text-foreground/70">{review.comment}</p>
              )}
              {review.photos.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {review.photos.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={url}
                      src={url}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
