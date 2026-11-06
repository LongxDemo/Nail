import { and, eq, gte } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db/client";
import { bookings, reviews } from "@/db/schema";

export const dynamic = "force-dynamic";

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export default async function AdminDashboardPage() {
  const db = await getDb();
  const today = todayIso();

  const [todaysBookings, upcoming, pendingReviews] = await Promise.all([
    db
      .select()
      .from(bookings)
      .where(and(eq(bookings.date, today), eq(bookings.status, "confirmed"))),
    db
      .select()
      .from(bookings)
      .where(and(gte(bookings.date, today), eq(bookings.status, "pending")))
      .orderBy(bookings.date, bookings.startTime)
      .limit(5),
    db.select().from(reviews).where(eq(reviews.isApproved, false)),
  ]);

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl text-brand-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Confirmed today" value={todaysBookings.length} href="/admin/bookings" />
        <StatCard label="Pending bookings" value={upcoming.length} href="/admin/bookings" />
        <StatCard
          label="Reviews to approve"
          value={pendingReviews.length}
          href="/admin/reviews"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground/80">
          Next pending bookings
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-foreground/50">Nothing pending.</p>
        ) : (
          <ul className="divide-y divide-border">
            {upcoming.map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {b.date} · {b.startTime}
                </span>
                <Link href={`/admin/bookings?date=${b.date}`} className="text-brand-600 hover:underline">
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand-300"
    >
      <p className="text-3xl font-semibold text-brand-700">{value}</p>
      <p className="mt-1 text-sm text-foreground/60">{label}</p>
    </Link>
  );
}
