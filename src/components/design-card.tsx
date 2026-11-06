"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localize, formatPrice } from "@/lib/format";
import { DesignPlaceholder } from "@/components/design-placeholder";
import type { NailShape } from "@/lib/format";

export interface GalleryDesign {
  id: string;
  categoryId: string;
  nameEn: string;
  nameKm: string;
  descriptionEn: string | null;
  descriptionKm: string | null;
  priceCents: number;
  swatchHex: string;
  imageUrl: string | null;
  shape: NailShape;
  isPopular: boolean;
  isNew: boolean;
}

export function DesignCard({
  design,
  locale,
  isFavorite,
  onToggleFavorite,
}: {
  design: GalleryDesign;
  locale: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const t = useTranslations("Gallery");
  const shapes = useTranslations("Shapes");
  const common = useTranslations("Common");

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="relative">
        <Link href={`/gallery/${design.id}`} className="block">
          {design.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={design.imageUrl}
              alt=""
              className="aspect-square w-full object-cover"
            />
          ) : (
            <DesignPlaceholder color={design.swatchHex} className="aspect-square w-full" />
          )}
        </Link>

        <button
          type="button"
          onClick={() => onToggleFavorite(design.id)}
          aria-label={isFavorite ? t("removeFavorite") : t("addFavorite")}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors hover:bg-white"
        >
          <Heart
            className={`h-4 w-4 ${isFavorite ? "fill-brand-500 text-brand-500" : "text-foreground/60"}`}
          />
        </button>

        {(design.isPopular || design.isNew) && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {design.isNew ? t("newBadge") : t("popularBadge")}
          </span>
        )}
      </div>

      <div className="p-3">
        <Link href={`/gallery/${design.id}`}>
          <p className="truncate text-sm font-medium text-foreground/90">
            {localize(locale, design.nameEn, design.nameKm)}
          </p>
        </Link>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="text-sm text-brand-600">{formatPrice(design.priceCents)}</p>
          <p className="text-xs text-foreground/50">{shapes(design.shape)}</p>
        </div>
        {(design.descriptionEn || design.descriptionKm) && (
          <p className="mt-1 line-clamp-2 text-xs text-foreground/60">
            {localize(locale, design.descriptionEn ?? "", design.descriptionKm)}
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <Link
            href={{ pathname: "/try-on", query: { designId: design.id } }}
            className="flex-1 rounded-full border border-brand-300 px-2 py-1.5 text-center text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            {common("tryThisDesign")}
          </Link>
          <Link
            href={{ pathname: "/booking", query: { designId: design.id } }}
            className="flex-1 rounded-full bg-brand-500 px-2 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-brand-600"
          >
            {common("bookThisDesign")}
          </Link>
        </div>
      </div>
    </div>
  );
}
