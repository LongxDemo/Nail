"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookings, customers, reviews, reviewPhotos } from "@/db/schema";
import { putMedia } from "@/lib/media";

const phoneSchema = z.string().trim().regex(/^[0-9+\-\s()]{6,20}$/);

export async function findReviewableBookings(phone: string) {
  const parsed = phoneSchema.safeParse(phone);
  if (!parsed.success) return [];

  const db = await getDb();
  return db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      designId: bookings.designId,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(
      and(
        eq(customers.phone, parsed.data),
        eq(bookings.status, "completed"),
        isNull(reviews.id),
      ),
    )
    .orderBy(bookings.date);
}

export async function submitReview(
  formData: FormData,
): Promise<{ id: string } | { error: string }> {
  const bookingId = formData.get("bookingId");
  const phone = formData.get("phone");
  const rating = Number(formData.get("rating"));
  const comment = formData.get("comment");

  if (
    typeof bookingId !== "string" ||
    typeof phone !== "string" ||
    typeof comment !== "string" ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    !phoneSchema.safeParse(phone).success
  ) {
    return { error: "invalid_input" };
  }

  const db = await getDb();
  const [eligible] = await db
    .select({ id: bookings.id, customerId: bookings.customerId })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .leftJoin(reviews, eq(reviews.bookingId, bookings.id))
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(customers.phone, phone),
        eq(bookings.status, "completed"),
        isNull(reviews.id),
      ),
    )
    .limit(1);

  if (!eligible) return { error: "not_eligible" };

  const reviewId = randomUUID();
  await db.insert(reviews).values({
    id: reviewId,
    customerId: eligible.customerId,
    bookingId: eligible.id,
    rating,
    comment: comment.trim() || null,
    isApproved: false,
  });

  const photos = formData.getAll("photos").filter((p): p is File => p instanceof File && p.size > 0);
  for (const [i, photo] of photos.entries()) {
    const url = await putMedia(`reviews/${reviewId}/${i}.jpg`, photo, "image/jpeg");
    await db.insert(reviewPhotos).values({ id: randomUUID(), reviewId, url });
  }

  return { id: reviewId };
}
