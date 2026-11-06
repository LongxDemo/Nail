import { and, eq, ne } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { bookings, closedDates, scheduleBlocks, technicians, workingHours } from "@/db/schema";

export const SLOT_STEP_MINUTES = 30;

type Db = Awaited<ReturnType<typeof getDb>>;

// Avoids timezone-parsing ambiguity: `new Date("YYYY-MM-DD")` is parsed as UTC
// midnight, and `.getDay()` can shift by a day depending on the server's local
// offset. Computing the weekday via `Date.UTC` + `getUTCDay()` is deterministic.
export function dateToDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function generateCandidateStarts(
  openTime: string,
  closeTime: string,
  durationMinutes: number,
): number[] {
  const open = toMinutes(openTime);
  const close = toMinutes(closeTime);
  const starts: number[] = [];
  for (let t = open; t + durationMinutes <= close; t += SLOT_STEP_MINUTES) {
    starts.push(t);
  }
  return starts;
}

interface OccupancyEntry {
  technicianId: string | null;
  start: number;
  end: number;
}

async function getOccupancy(
  db: Db,
  date: string,
  excludeBookingId?: string,
): Promise<OccupancyEntry[]> {
  const conditions = [eq(bookings.date, date), ne(bookings.status, "cancelled"), ne(bookings.status, "no_show")];
  if (excludeBookingId) conditions.push(ne(bookings.id, excludeBookingId));

  const [bookingRows, blockRows] = await Promise.all([
    db
      .select({ technicianId: bookings.technicianId, startTime: bookings.startTime, endTime: bookings.endTime })
      .from(bookings)
      .where(and(...conditions)),
    db
      .select({ technicianId: scheduleBlocks.technicianId, startTime: scheduleBlocks.startTime, endTime: scheduleBlocks.endTime })
      .from(scheduleBlocks)
      .where(eq(scheduleBlocks.date, date)),
  ]);

  return [...bookingRows, ...blockRows].map((row) => ({
    technicianId: row.technicianId,
    start: toMinutes(row.startTime),
    end: toMinutes(row.endTime),
  }));
}

export async function getActiveTechnicians(db: Db) {
  return db.select().from(technicians).where(eq(technicians.isActive, true));
}

async function getOpenHours(db: Db, date: string): Promise<{ openTime: string; closeTime: string } | null> {
  const dow = dateToDayOfWeek(date);

  const [hours] = await db.select().from(workingHours).where(eq(workingHours.dayOfWeek, dow)).limit(1);
  if (!hours || hours.isClosed) return null;

  const [closed] = await db.select().from(closedDates).where(eq(closedDates.date, date)).limit(1);
  if (closed) return null;

  return { openTime: hours.openTime, closeTime: hours.closeTime };
}

function isFreeFor(
  techId: string | null,
  start: number,
  end: number,
  occupancy: OccupancyEntry[],
): boolean {
  return !occupancy.some(
    (o) => (o.technicianId === techId || o.technicianId === null) && overlaps(start, end, o.start, o.end),
  );
}

export interface AvailabilityParams {
  date: string;
  durationMinutes: number;
  technicianId?: string | null;
  excludeBookingId?: string;
}

export async function getAvailableSlots(db: Db, params: AvailabilityParams): Promise<string[]> {
  const hours = await getOpenHours(db, params.date);
  if (!hours) return [];

  const candidates = generateCandidateStarts(hours.openTime, hours.closeTime, params.durationMinutes);
  const occupancy = await getOccupancy(db, params.date, params.excludeBookingId);

  if (params.technicianId) {
    return candidates
      .filter((start) => isFreeFor(params.technicianId!, start, start + params.durationMinutes, occupancy))
      .map(toHHMM);
  }

  const activeTechnicians = await getActiveTechnicians(db);
  if (activeTechnicians.length === 0) {
    // No technicians configured -- treat the whole salon as one resource:
    // any occupancy entry at all (regardless of technicianId) blocks the slot.
    return candidates
      .filter((start) => !occupancy.some((o) => overlaps(start, start + params.durationMinutes, o.start, o.end)))
      .map(toHHMM);
  }

  return candidates
    .filter((start) =>
      activeTechnicians.some((t) => isFreeFor(t.id, start, start + params.durationMinutes, occupancy)),
    )
    .map(toHHMM);
}

export interface AssignTechnicianParams {
  date: string;
  startTime: string;
  durationMinutes: number;
  technicianId?: string | null;
  excludeBookingId?: string;
}

export type AssignTechnicianResult = { ok: true; technicianId: string | null } | { ok: false };

// Re-run at booking-creation time (not just when displaying slots) to guard
// against a race where two customers grab the same slot between page load
// and submit.
export async function assignTechnician(
  db: Db,
  params: AssignTechnicianParams,
): Promise<AssignTechnicianResult> {
  const occupancy = await getOccupancy(db, params.date, params.excludeBookingId);
  const start = toMinutes(params.startTime);
  const end = start + params.durationMinutes;

  if (params.technicianId) {
    return isFreeFor(params.technicianId, start, end, occupancy)
      ? { ok: true, technicianId: params.technicianId }
      : { ok: false };
  }

  const activeTechnicians = await getActiveTechnicians(db);
  if (activeTechnicians.length === 0) {
    const free = !occupancy.some((o) => overlaps(start, end, o.start, o.end));
    return free ? { ok: true, technicianId: null } : { ok: false };
  }

  const freeTechnician = activeTechnicians.find((t) => isFreeFor(t.id, start, end, occupancy));
  return freeTechnician ? { ok: true, technicianId: freeTechnician.id } : { ok: false };
}

export function slotEndTime(startTime: string, durationMinutes: number): string {
  return toHHMM(toMinutes(startTime) + durationMinutes);
}

export const CANCELLATION_CUTOFF_HOURS = 3;

export function hoursUntilAppointment(date: string, startTime: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = startTime.split(":").map(Number);
  const appointmentMs = new Date(y, m - 1, d, h, min).getTime();
  return (appointmentMs - Date.now()) / (1000 * 60 * 60);
}

export function canModifyBooking(date: string, startTime: string): boolean {
  return hoursUntilAppointment(date, startTime) >= CANCELLATION_CUTOFF_HOURS;
}
