import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDb } from "@/db/client";
import { getDesignById } from "@/db/queries";
import { localize, formatPrice } from "@/lib/format";
import { DesignPlaceholder } from "@/components/design-placeholder";
import { FavoriteButton } from "@/components/favorite-button";

export const dynamic = "force-dynamic";

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("DesignDetail");
  const common = await getTranslations("Common");
  const shapes = await getTranslations("Shapes");

  const db = await getDb();
  const result = await getDesignById(db, id);
  if (!result) notFound();
  const { design, images } = result;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/gallery"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>

      <div className="relative">
        {images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={images[0].url}
            alt=""
            className="aspect-square w-full rounded-3xl object-cover"
          />
        ) : (
          <DesignPlaceholder color={design.swatchHex} className="aspect-square w-full rounded-3xl" />
        )}
        <FavoriteButton designId={design.id} className="absolute right-3 top-3" />
      </div>

      <div className="mt-5">
        <h1 className="font-display text-2xl text-brand-900">
          {localize(locale, design.nameEn, design.nameKm)}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-lg font-medium text-brand-600">{formatPrice(design.priceCents)}</p>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            {shapes(design.shape)}
          </span>
        </div>
        {(design.descriptionEn || design.descriptionKm) && (
          <p className="mt-3 text-foreground/70">
            {localize(locale, design.descriptionEn ?? "", design.descriptionKm)}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={{ pathname: "/try-on", query: { designId: design.id } }}
          className="flex-1 rounded-full border border-brand-300 px-6 py-3 text-center font-medium text-brand-700 transition-colors hover:bg-brand-50"
        >
          {common("tryThisDesign")}
        </Link>
        <Link
          href={{ pathname: "/booking", query: { designId: design.id } }}
          className="flex-1 rounded-full bg-brand-500 px-6 py-3 text-center font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
        >
          {common("bookThisDesign")}
        </Link>
      </div>
    </div>
  );
}
