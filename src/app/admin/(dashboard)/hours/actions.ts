"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { closedDates, scheduleBlocks, workingHours } from "@/db/schema";

export async function updateAllWorkingHours(formData: FormData): Promise<void> {
  const db = await getDb();

  for (let day = 0; day <= 6; day++) {
    const openTime = formData.get(`open_${day}`);
    const closeTime = formData.get(`close_${day}`);
    const isClosed = formData.get(`closed_${day}`) === "on";
    if (typeof openTime !== "string" || typeof closeTime !== "string") continue;

    await db
      .update(workingHours)
      .set({ openTime, closeTime, isClosed })
      .where(eq(workingHours.dayOfWeek, day));
  }

  revalidatePath("/admin/hours");
  revalidatePath("/about");
}

export async function addClosedDate(formData: FormData): Promise<void> {
  const date = formData.get("date");
  const reason = formData.get("reason");
  if (typeof date !== "string" || !date) return;

  const db = await getDb();
  await db
    .insert(closedDates)
    .values({ id: randomUUID(), date, reason: typeof reason === "string" ? reason || null : null })
    .onConflictDoNothing();

  revalidatePath("/admin/hours");
}

export async function removeClosedDate(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(closedDates).where(eq(closedDates.id, id));
  revalidatePath("/admin/hours");
}

export async function addScheduleBlock(formData: FormData): Promise<void> {
  const date = formData.get("date");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const technicianId = formData.get("technicianId");
  const reason = formData.get("reason");
  if (
    typeof date !== "string" ||
    !date ||
    typeof startTime !== "string" ||
    !startTime ||
    typeof endTime !== "string" ||
    !endTime ||
    endTime <= startTime
  ) {
    return;
  }

  const db = await getDb();
  await db.insert(scheduleBlocks).values({
    id: randomUUID(),
    date,
    startTime,
    endTime,
    technicianId: typeof technicianId === "string" && technicianId ? technicianId : null,
    reason: typeof reason === "string" ? reason || null : null,
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/admin/hours");
}

export async function removeScheduleBlock(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(scheduleBlocks).where(eq(scheduleBlocks.id, id));
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/hours");
}
