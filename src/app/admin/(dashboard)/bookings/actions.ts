"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { bookings, bookingStatusValues } from "@/db/schema";

export async function updateBookingStatus(bookingId: string, status: string): Promise<void> {
  if (!bookingStatusValues.includes(status as (typeof bookingStatusValues)[number])) return;

  const db = await getDb();
  await db
    .update(bookings)
    .set({ status: status as (typeof bookingStatusValues)[number], updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}
