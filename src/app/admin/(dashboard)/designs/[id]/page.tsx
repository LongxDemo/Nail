import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db/client";
import { designCategories, designImages, designs } from "@/db/schema";
import { DesignForm } from "@/components/admin/design-form";
import { addDesignImage, deleteDesignImage, updateDesign } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();

  const [design] = await db.select().from(designs).where(eq(designs.id, id)).limit(1);
  if (!design) notFound();

  const categories = await db
    .select({ id: designCategories.id, nameEn: designCategories.nameEn })
    .from(designCategories)
    .orderBy(asc(designCategories.sortOrder));

  const images = await db
    .select()
    .from(designImages)
    .where(eq(designImages.designId, id))
    .orderBy(asc(designImages.sortOrder));

  return (
    <div>
      <h1 className="font-display mb-4 text-2xl text-brand-900">Edit design</h1>

      <DesignForm
        action={updateDesign.bind(null, id)}
        categories={categories}
        submitLabel="Save changes"
        initial={{
          categoryId: design.categoryId,
          nameEn: design.nameEn,
          nameKm: design.nameKm,
          descriptionEn: design.descriptionEn,
          descriptionKm: design.descriptionKm,
          shape: design.shape,
          priceCents: design.priceCents,
          swatchHex: design.swatchHex,
          isPopular: design.isPopular,
          isActive: design.isActive,
        }}
      />

      <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground/80">Photos</h2>

        {images.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-24 w-24 rounded-xl object-cover" />
                <form action={deleteDesignImage.bind(null, img.id, id)} className="absolute -right-2 -top-2">
                  <button
                    type="submit"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <form action={addDesignImage.bind(null, id)} className="flex flex-wrap items-center gap-2">
          <input type="file" name="image" accept="image/*" required className="text-sm" />
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
}
