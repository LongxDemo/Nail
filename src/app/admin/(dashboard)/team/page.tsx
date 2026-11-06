import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { adminUsers } from "@/db/schema";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { createAdmin, deleteAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const current = await getCurrentAdmin();

  if (current?.role !== "owner") {
    return (
      <div>
        <h1 className="font-display mb-4 text-2xl text-brand-900">Team</h1>
        <p className="text-sm text-foreground/60">
          Only the owner account can manage admin logins.
        </p>
      </div>
    );
  }

  const db = await getDb();
  const admins = await db.select().from(adminUsers).orderBy(asc(adminUsers.createdAt));

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl text-brand-900">Team</h1>

      <div className="space-y-2">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
          >
            <div>
              <p className="font-medium text-foreground/90">{admin.email}</p>
              <p className="text-sm capitalize text-foreground/60">{admin.role}</p>
            </div>
            {admin.id !== current.id && admins.length > 1 && (
              <form action={deleteAdmin.bind(null, admin.id)}>
                <button
                  type="submit"
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-300"
                >
                  Remove
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <details className="mt-4 rounded-2xl border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground/80">
          Add an admin login
        </summary>
        <form action={createAdmin} className="mt-3 flex flex-wrap gap-2">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 characters)"
            minLength={8}
            required
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            name="role"
            defaultValue="staff"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add admin
          </button>
        </form>
      </details>
    </div>
  );
}
