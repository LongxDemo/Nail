import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { closedDates, scheduleBlocks, technicians, workingHours } from "@/db/schema";
import {
  addClosedDate,
  addScheduleBlock,
  removeClosedDate,
  removeScheduleBlock,
  updateAllWorkingHours,
} from "./actions";

export const dynamic = "force-dynamic";

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AdminHoursPage() {
  const db = await getDb();
  const hours = await db.select().from(workingHours).orderBy(asc(workingHours.dayOfWeek));
  const closures = await db.select().from(closedDates).orderBy(asc(closedDates.date));
  const technicianRows = await db
    .select({ id: technicians.id, name: technicians.name })
    .from(technicians)
    .orderBy(asc(technicians.sortOrder));
  const blocks = await db
    .select({
      id: scheduleBlocks.id,
      date: scheduleBlocks.date,
      startTime: scheduleBlocks.startTime,
      endTime: scheduleBlocks.endTime,
      reason: scheduleBlocks.reason,
      technicianName: technicians.name,
    })
    .from(scheduleBlocks)
    .leftJoin(technicians, eq(scheduleBlocks.technicianId, technicians.id))
    .orderBy(asc(scheduleBlocks.date), asc(scheduleBlocks.startTime));

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl text-brand-900">Working hours</h1>

      <form action={updateAllWorkingHours} className="rounded-2xl border border-border bg-surface p-4">
        <div className="space-y-3">
          {hours.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-sm font-medium text-foreground/80">
                {DAY_LABELS[row.dayOfWeek]}
              </span>
              <input
                type="time"
                name={`open_${row.dayOfWeek}`}
                defaultValue={row.openTime}
                className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
              />
              <span className="text-foreground/40">–</span>
              <input
                type="time"
                name={`close_${row.dayOfWeek}`}
                defaultValue={row.closeTime}
                className="rounded-lg border border-border bg-background px-2 py-1 text-sm"
              />
              <label className="flex items-center gap-1.5 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  name={`closed_${row.dayOfWeek}`}
                  defaultChecked={row.isClosed}
                />
                Closed
              </label>
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="mt-4 rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Save hours
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground/80">Closed dates / holidays</h2>
        <form action={addClosedDate} className="mb-4 flex flex-wrap gap-2">
          <input
            type="date"
            name="date"
            required
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            type="text"
            name="reason"
            placeholder="Reason (optional)"
            className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add
          </button>
        </form>

        {closures.length === 0 ? (
          <p className="text-sm text-foreground/50">No closures scheduled.</p>
        ) : (
          <ul className="divide-y divide-border">
            {closures.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {c.date} {c.reason && <span className="text-foreground/50">· {c.reason}</span>}
                </span>
                <form action={removeClosedDate.bind(null, c.id)}>
                  <button type="submit" className="text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground/80">Breaks &amp; time blocks</h2>
        <p className="mb-3 text-xs text-foreground/50">
          Block part of a day for a break, appointment downtime, etc. Leave technician blank to
          block the whole salon for that time.
        </p>
        <form action={addScheduleBlock} className="mb-4 flex flex-wrap gap-2">
          <input
            type="date"
            name="date"
            required
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            type="time"
            name="startTime"
            required
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            type="time"
            name="endTime"
            required
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <select
            name="technicianId"
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Whole salon</option>
            {technicianRows.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="reason"
            placeholder="Reason (optional)"
            className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add
          </button>
        </form>

        {blocks.length === 0 ? (
          <p className="text-sm text-foreground/50">No breaks or blocks scheduled.</p>
        ) : (
          <ul className="divide-y divide-border">
            {blocks.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {b.date} · {b.startTime}–{b.endTime} ·{" "}
                  <span className="text-foreground/60">{b.technicianName ?? "Whole salon"}</span>
                  {b.reason && <span className="text-foreground/50"> · {b.reason}</span>}
                </span>
                <form action={removeScheduleBlock.bind(null, b.id)}>
                  <button type="submit" className="text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
