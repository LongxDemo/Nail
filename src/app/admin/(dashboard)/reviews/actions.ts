"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { reviewPhotos, reviews } from "@/db/schema";
import { getMediaBucket, MEDIA_URL_PREFIX } from "@/lib/media";

export async function setReviewApproval(reviewId: string, approved: boolean): Promise<void> {
  const db = await getDb();
  await db.update(reviews).set({ isApproved: approved }).where(eq(reviews.id, reviewId));
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function deleteReview(reviewId: string): Promise<void> {
  const db = await getDb();
  const photos = await db
    .select()
    .from(reviewPhotos)
    .where(eq(reviewPhotos.reviewId, reviewId));

  if (photos.length > 0) {
    const bucket = await getMediaBucket();
    await Promise.all(
      photos.map((p) => bucket.delete(p.url.replace(MEDIA_URL_PREFIX, ""))),
    );
  }

  await db.delete(reviewPhotos).where(eq(reviewPhotos.reviewId, reviewId));
  await db.delete(reviews).where(eq(reviews.id, reviewId));

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}
