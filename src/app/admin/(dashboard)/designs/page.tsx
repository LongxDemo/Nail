import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { getDb } from "@/db/client";
import { designCategories, designs } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { createCategory, deleteDesign } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDesignsPage() {
  const db = await getDb();
  const categories = await db
    .select()
    .from(designCategories)
    .orderBy(asc(designCategories.sortOrder));
  const items = await db
    .select({
      id: designs.id,
      nameEn: designs.nameEn,
      priceCents: designs.priceCents,
      shape: designs.shape,
      isPopular: designs.isPopular,
      isActive: designs.isActive,
      categoryName: designCategories.nameEn,
    })
    .from(designs)
    .leftJoin(designCategories, eq(designs.categoryId, designCategories.id))
    .orderBy(asc(designs.nameEn));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-2xl text-brand-900">Designs</h1>
        <Link
          href="/admin/designs/new"
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Add design
        </Link>
      </div>

      <details className="mb-4 rounded-2xl border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground/80">
          Categories ({categories.length}) — add one
        </summary>
        <form action={createCategory} className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            name="nameEn"
            placeholder="Name (English)"
            required
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="nameKm"
            placeholder="Name (Khmer)"
            required
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add category
          </button>
        </form>
      </details>

      {categories.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Add a category above before creating your first design.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3"
            >
              <div>
                <p className="font-medium text-foreground/90">
                  {d.nameEn}{" "}
                  {!d.isActive && (
                    <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      Hidden
                    </span>
                  )}
                  {d.isPopular && (
                    <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                      Popular
                    </span>
                  )}
                </p>
                <p className="text-sm capitalize text-foreground/60">
                  {d.categoryName} · {formatPrice(d.priceCents)} · {d.shape}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/designs/${d.id}`}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:border-brand-300 hover:text-brand-700"
                >
                  Edit
                </Link>
                <form action={deleteDesign.bind(null, d.id)}>
                  <button
                    type="submit"
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-300"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
