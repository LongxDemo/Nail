import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getDb } from "@/db/client";
import { listCategories, listDesigns } from "@/db/queries";
import { isRecentlyAdded, localize } from "@/lib/format";
import { GalleryGrid } from "@/components/gallery-grid";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category: selectedCategory } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("Gallery");

  const db = await getDb();
  const [categories, items] = await Promise.all([
    listCategories(db),
    listDesigns(db, selectedCategory),
  ]);

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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display mb-4 text-3xl text-brand-900">{t("title")}</h1>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <CategoryChip href="/gallery" active={!selectedCategory}>
          {t("allCategories")}
        </CategoryChip>
        {categories.map((cat) => (
          <CategoryChip
            key={cat.id}
            href={`/gallery?category=${cat.id}`}
            active={selectedCategory === cat.id}
          >
            {localize(locale, cat.nameEn, cat.nameKm)}
          </CategoryChip>
        ))}
      </div>

      <GalleryGrid designs={designs} locale={locale} />
    </div>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-500 bg-brand-500 text-white"
          : "border-border bg-surface text-foreground/70 hover:border-brand-300"
      }`}
    >
      {children}
    </Link>
  );
}
