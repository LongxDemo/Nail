"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/lib/favorites";

export function FavoriteButton({ designId, className }: { designId: string; className?: string }) {
  const t = useTranslations("Gallery");
  const { favorites, toggleFavorite } = useFavorites();
  const isFavorite = favorites.has(designId);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(designId)}
      aria-label={isFavorite ? t("removeFavorite") : t("addFavorite")}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors hover:bg-white ${className ?? ""}`}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? "fill-brand-500 text-brand-500" : "text-foreground/60"}`} />
    </button>
  );
}
