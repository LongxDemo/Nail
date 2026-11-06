import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db/client";
import { bookings, customers, services, technicians, scheduleBlocks } from "@/db/schema";
import { updateBookingStatus } from "./actions";

export const dynamic = "force-dynamic";

const NEXT_STATUS: Partial<Record<string, { label: string; status: string }[]>> = {
  pending: [
    { label: "Confirm", status: "confirmed" },
    { label: "Cancel", status: "cancelled" },
  ],
  confirmed: [
    { label: "Mark completed", status: "completed" },
    { label: "No-show", status: "no_show" },
    { label: "Cancel", status: "cancelled" },
  ],
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-brand-100 text-brand-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
  no_show: "bg-red-100 text-red-700",
};

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function addDays(dateIso: string, delta: number): string {
  const d = new Date(`${dateIso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(dateIso: string): string {
  const d = new Date(`${dateIso}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayIso();
  const db = await getDb();

  const rows = await db
    .select({
      id: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
      note: bookings.note,
      customerName: customers.name,
      customerPhone: customers.phone,
      serviceNameEn: services.nameEn,
      technicianName: technicians.name,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(technicians, eq(bookings.technicianId, technicians.id))
    .where(eq(bookings.date, date))
    .orderBy(asc(bookings.startTime));

  const blocks = await db
    .select({
      id: scheduleBlocks.id,
      startTime: scheduleBlocks.startTime,
      endTime: scheduleBlocks.endTime,
      reason: scheduleBlocks.reason,
      technicianName: technicians.name,
    })
    .from(scheduleBlocks)
    .leftJoin(technicians, eq(scheduleBlocks.technicianId, technicians.id))
    .where(eq(scheduleBlocks.date, date))
    .orderBy(asc(scheduleBlocks.startTime));

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl text-brand-900">Bookings</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/bookings?date=${addDays(date, -1)}`}
          className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand-300 hover:text-brand-700"
        >
          ← Prev
        </Link>
        <Link
          href={`/admin/bookings?date=${todayIso()}`}
          className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand-300 hover:text-brand-700"
        >
          Today
        </Link>
        <Link
          href={`/admin/bookings?date=${addDays(date, 1)}`}
          className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand-300 hover:text-brand-700"
        >
          Next →
        </Link>
        <form method="get" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand-300 hover:text-brand-700"
          >
            Go
          </button>
        </form>
        <span className="ml-1 text-sm font-medium text-foreground/60">{formatDayLabel(date)}</span>
      </div>

      {blocks.length > 0 && (
        <div className="mb-4 rounded-2xl border border-dashed border-border bg-surface/50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Blocked time
          </p>
          <ul className="space-y-1 text-sm text-foreground/60">
            {blocks.map((b) => (
              <li key={b.id}>
                {b.startTime}–{b.endTime} · {b.technicianName ?? "Whole salon"}
                {b.reason && <span className="text-foreground/40"> · {b.reason}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-foreground/50">No bookings on this day.</p>
        ) : (
          rows.map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground/90">
                    {b.startTime}–{b.endTime}
                  </p>
                  <p className="text-sm text-foreground/70">
                    {b.customerName} · {b.customerPhone}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {b.serviceNameEn}
                    {b.technicianName && <> · {b.technicianName}</>}
                  </p>
                  {b.note && <p className="mt-1 text-xs text-foreground/50">Note: {b.note}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status] ?? ""}`}
                >
                  {b.status}
                </span>
              </div>
              {NEXT_STATUS[b.status] && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {NEXT_STATUS[b.status]!.map((action) => (
                    <form key={action.status} action={updateBookingStatus.bind(null, b.id, action.status)}>
                      <button
                        type="submit"
                        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-brand-300 hover:text-brand-700"
                      >
                        {action.label}
                      </button>
                    </form>
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
