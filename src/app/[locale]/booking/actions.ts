"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bookings, customers, services, technicians } from "@/db/schema";
import {
  assignTechnician,
  canModifyBooking,
  getAvailableSlots,
  slotEndTime,
} from "@/lib/booking/availability";

async function getServiceDuration(
  db: Awaited<ReturnType<typeof getDb>>,
  serviceId: string,
): Promise<number | null> {
  const [service] = await db
    .select({ durationMinutes: services.durationMinutes })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.isActive, true)))
    .limit(1);
  return service?.durationMinutes ?? null;
}

export async function fetchAvailableSlots(
  date: string,
  serviceId: string,
  technicianId?: string,
  excludeBookingId?: string,
): Promise<string[]> {
  const db = await getDb();
  const durationMinutes = await getServiceDuration(db, serviceId);
  if (!durationMinutes) return [];
  return getAvailableSlots(db, { date, durationMinutes, technicianId, excludeBookingId });
}

const createBookingSchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{6,20}$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  serviceId: z.string().min(1),
  designId: z.string().optional(),
  technicianId: z.string().optional(),
  note: z.string().trim().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export async function createBooking(
  input: CreateBookingInput,
): Promise<{ id: string } | { error: string }> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) return { error: "invalid_input" };
  const { name, phone, date, startTime, serviceId, designId, technicianId, note } = parsed.data;

  const db = await getDb();

  const durationMinutes = await getServiceDuration(db, serviceId);
  if (!durationMinutes) return { error: "invalid_service" };

  const assignment = await assignTechnician(db, { date, startTime, durationMinutes, technicianId });
  if (!assignment.ok) return { error: "slot_unavailable" };

  let [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .limit(1);

  if (!customer) {
    const id = randomUUID();
    await db.insert(customers).values({ id, phone, name });
    customer = { id, phone, name, email: null, preferredLanguage: "en", createdAt: new Date() };
  } else if (customer.name !== name) {
    await db.update(customers).set({ name }).where(eq(customers.id, customer.id));
  }

  const bookingId = randomUUID();
  await db.insert(bookings).values({
    id: bookingId,
    customerId: customer.id,
    serviceId,
    designId: designId || null,
    technicianId: assignment.technicianId,
    note: note || null,
    date,
    startTime,
    endTime: slotEndTime(startTime, durationMinutes),
    status: "pending",
  });

  return { id: bookingId };
}

const phoneSchema = z.string().trim().regex(/^[0-9+\-\s()]{6,20}$/);

export async function lookupBookingsByPhone(phone: string) {
  const parsed = phoneSchema.safeParse(phone);
  if (!parsed.success) return [];

  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, parsed.data))
    .limit(1);
  if (!customer) return [];

  const rows = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      status: bookings.status,
      designId: bookings.designId,
      technicianId: bookings.technicianId,
      serviceNameEn: services.nameEn,
      serviceNameKm: services.nameKm,
      serviceDurationMinutes: services.durationMinutes,
      servicePriceCents: services.priceCents,
      technicianName: technicians.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(technicians, eq(bookings.technicianId, technicians.id))
    .where(eq(bookings.customerId, customer.id))
    .orderBy(bookings.date, bookings.startTime);

  return rows.map((b) => ({ ...b, canModify: canModifyBooking(b.date, b.startTime) }));
}

export async function cancelBooking(
  bookingId: string,
  phone: string,
): Promise<{ ok: true } | { error: string }> {
  const parsedPhone = phoneSchema.safeParse(phone);
  if (!parsedPhone.success) return { error: "invalid_phone" };

  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, parsedPhone.data))
    .limit(1);
  if (!customer) return { error: "not_found" };

  const [booking] = await db
    .select({ date: bookings.date, startTime: bookings.startTime })
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, customer.id)))
    .limit(1);
  if (!booking) return { error: "not_found" };
  if (!canModifyBooking(booking.date, booking.startTime)) return { error: "too_late" };

  const result = await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.customerId, customer.id),
        ne(bookings.status, "cancelled"),
      ),
    )
    .returning({ id: bookings.id });

  if (result.length === 0) return { error: "not_found" };
  return { ok: true };
}

export async function cancelBookingFormAction(bookingId: string, phone: string): Promise<void> {
  await cancelBooking(bookingId, phone);
}

export async function getBookingForReschedule(bookingId: string, phone: string) {
  const parsedPhone = phoneSchema.safeParse(phone);
  if (!parsedPhone.success) return null;

  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, parsedPhone.data))
    .limit(1);
  if (!customer) return null;

  const [row] = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      startTime: bookings.startTime,
      status: bookings.status,
      serviceId: bookings.serviceId,
      technicianId: bookings.technicianId,
      serviceNameEn: services.nameEn,
      serviceNameKm: services.nameKm,
      serviceDurationMinutes: services.durationMinutes,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, customer.id)))
    .limit(1);
  if (!row) return null;

  const canModify =
    row.status !== "cancelled" && row.status !== "completed" && canModifyBooking(row.date, row.startTime);

  return { ...row, canModify };
}

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  technicianId: z.string().optional(),
});

export async function rescheduleBooking(
  bookingId: string,
  phone: string,
  input: z.infer<typeof rescheduleSchema>,
): Promise<{ ok: true } | { error: string }> {
  const parsedPhone = phoneSchema.safeParse(phone);
  const parsedInput = rescheduleSchema.safeParse(input);
  if (!parsedPhone.success || !parsedInput.success) return { error: "invalid_input" };

  const db = await getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, parsedPhone.data))
    .limit(1);
  if (!customer) return { error: "not_found" };

  const [booking] = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.customerId, customer.id)))
    .limit(1);
  if (!booking) return { error: "not_found" };
  if (booking.status === "cancelled" || booking.status === "completed") {
    return { error: "not_modifiable" };
  }
  if (!canModifyBooking(booking.date, booking.startTime)) return { error: "too_late" };

  const durationMinutes = await getServiceDuration(db, booking.serviceId);
  if (!durationMinutes) return { error: "invalid_service" };

  const { date, startTime, technicianId } = parsedInput.data;
  const assignment = await assignTechnician(db, {
    date,
    startTime,
    durationMinutes,
    technicianId,
    excludeBookingId: bookingId,
  });
  if (!assignment.ok) return { error: "slot_unavailable" };

  await db
    .update(bookings)
    .set({
      date,
      startTime,
      endTime: slotEndTime(startTime, durationMinutes),
      technicianId: assignment.technicianId,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  return { ok: true };
}
