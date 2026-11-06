import { asc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { services, technicians } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import {
  createService,
  updateService,
  deleteService,
  createTechnician,
  updateTechnician,
  deleteTechnician,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const db = await getDb();
  const serviceRows = await db.select().from(services).orderBy(asc(services.sortOrder));
  const technicianRows = await db.select().from(technicians).orderBy(asc(technicians.sortOrder));

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display mb-4 text-2xl text-brand-900">Services</h1>

        <div className="space-y-2">
          {serviceRows.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-surface p-3">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground/90">
                      {s.nameEn}{" "}
                      {!s.isActive && (
                        <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          Hidden
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {s.durationMinutes} min · {formatPrice(s.priceCents)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-brand-600">Edit</span>
                </summary>

                <form
                  action={updateService.bind(null, s.id)}
                  className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-3"
                >
                  <input
                    type="text"
                    name="nameEn"
                    defaultValue={s.nameEn}
                    placeholder="Name (English)"
                    required
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    name="nameKm"
                    defaultValue={s.nameKm}
                    placeholder="Name (Khmer)"
                    required
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    name="durationMinutes"
                    defaultValue={s.durationMinutes}
                    min={5}
                    max={480}
                    step={5}
                    placeholder="Duration (min)"
                    required
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    name="price"
                    defaultValue={(s.priceCents / 100).toFixed(2)}
                    min={0}
                    step={0.01}
                    placeholder="Price ($)"
                    required
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    name="sortOrder"
                    defaultValue={s.sortOrder}
                    placeholder="Sort order"
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-foreground/70">
                    <input type="checkbox" name="isActive" defaultChecked={s.isActive} />
                    Active
                  </label>
                  <div className="col-span-2 flex gap-2 sm:col-span-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                    >
                      Save
                    </button>
                  </div>
                </form>
                <form action={deleteService.bind(null, s.id)} className="mt-2">
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-300"
                  >
                    Delete
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>

        <details className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground/80">
            Add a service
          </summary>
          <form action={createService} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <input
              type="text"
              name="nameEn"
              placeholder="Name (English)"
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="text"
              name="nameKm"
              placeholder="Name (Khmer)"
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              name="durationMinutes"
              placeholder="Duration (min)"
              min={5}
              max={480}
              step={5}
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              name="price"
              placeholder="Price ($)"
              min={0}
              step={0.01}
              required
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              name="sortOrder"
              placeholder="Sort order"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-foreground/70">
              <input type="checkbox" name="isActive" defaultChecked />
              Active
            </label>
            <button
              type="submit"
              className="col-span-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:col-span-3"
            >
              Add service
            </button>
          </form>
        </details>
      </section>

      <section>
        <h2 className="font-display mb-4 text-2xl text-brand-900">Technicians</h2>

        <div className="space-y-2">
          {technicianRows.map((tech) => (
            <div key={tech.id} className="rounded-2xl border border-border bg-surface p-3">
              <details>
                <summary className="flex cursor-pointer items-center justify-between gap-3">
                  <p className="font-medium text-foreground/90">
                    {tech.name}{" "}
                    {!tech.isActive && (
                      <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        Hidden
                      </span>
                    )}
                  </p>
                  <span className="shrink-0 text-xs font-medium text-brand-600">Edit</span>
                </summary>

                <form
                  action={updateTechnician.bind(null, tech.id)}
                  className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"
                >
                  <input
                    type="text"
                    name="name"
                    defaultValue={tech.name}
                    placeholder="Name"
                    required
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    name="sortOrder"
                    defaultValue={tech.sortOrder}
                    placeholder="Sort order"
                    className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm text-foreground/70">
                    <input type="checkbox" name="isActive" defaultChecked={tech.isActive} />
                    Active
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Save
                  </button>
                </form>
                <form action={deleteTechnician.bind(null, tech.id)} className="mt-2">
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-300"
                  >
                    Delete
                  </button>
                </form>
              </details>
            </div>
          ))}
        </div>

        <details className="mt-4 rounded-2xl border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground/80">
            Add a technician
          </summary>
          <form action={createTechnician} className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <input
              type="number"
              name="sortOrder"
              placeholder="Sort order"
              className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-foreground/70">
              <input type="checkbox" name="isActive" defaultChecked />
              Active
            </label>
            <button
              type="submit"
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add technician
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
