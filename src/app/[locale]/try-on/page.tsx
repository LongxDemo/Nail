import { setRequestLocale } from "next-intl/server";
import { getDb } from "@/db/client";
import { listCategories, listDesigns } from "@/db/queries";
import { isRecentlyAdded } from "@/lib/format";
import { TryOnStudio } from "@/components/try-on-studio";

export const dynamic = "force-dynamic";

export default async function TryOnPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ designId?: string }>;
}) {
  const { locale } = await params;
  const { designId } = await searchParams;
  setRequestLocale(locale);

  const db = await getDb();
  const [categories, items] = await Promise.all([listCategories(db), listDesigns(db)]);

  const designs = items.map((d) => ({
    id: d.id,
    categoryId: d.categoryId,
    nameEn: d.nameEn,
    nameKm: d.nameKm,
    descriptionEn: d.descriptionEn,
    descriptionKm: d.descriptionKm,
    priceCents: d.priceCents,
    swatchHex: d.swatchHex,
    imageUrl: d.imageUrl,
    shape: d.shape,
    isPopular: d.isPopular,
    isNew: isRecentlyAdded(d.createdAt),
  }));

  return (
    <TryOnStudio
      designs={designs}
      categories={categories.map((c) => ({ id: c.id, nameEn: c.nameEn, nameKm: c.nameKm }))}
      initialDesignId={designId}
    />
  );
}
