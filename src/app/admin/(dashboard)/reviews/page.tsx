import { desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";
import { getDb } from "@/db/client";
import { customers, reviewPhotos, reviews } from "@/db/schema";
import { deleteReview, setReviewApproval } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const db = await getDb();

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      isApproved: reviews.isApproved,
      customerName: customers.name,
    })
    .from(reviews)
    .innerJoin(customers, eq(customers.id, reviews.customerId))
    .orderBy(desc(reviews.createdAt));

  const allPhotos = await db.select().from(reviewPhotos);
  const photosByReview = new Map<string, string[]>();
  for (const p of allPhotos) {
    const list = photosByReview.get(p.reviewId) ?? [];
    list.push(p.url);
    photosByReview.set(p.reviewId, list);
  }

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl text-brand-900">Reviews</h1>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-foreground/50">No reviews yet.</p>
        ) : (
          rows.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
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
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    review.isApproved
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {review.isApproved ? "Approved" : "Pending"}
                </span>
              </div>

              {review.comment && <p className="mt-2 text-foreground/70">{review.comment}</p>}

              {(photosByReview.get(review.id) ?? []).length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {photosByReview.get(review.id)!.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <form action={setReviewApproval.bind(null, review.id, !review.isApproved)}>
                  <button
                    type="submit"
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-brand-300 hover:text-brand-700"
                  >
                    {review.isApproved ? "Hide" : "Approve"}
                  </button>
                </form>
                <form action={deleteReview.bind(null, review.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-300"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
