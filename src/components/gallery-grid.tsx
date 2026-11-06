"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DesignCard, type GalleryDesign } from "@/components/design-card";
import { useFavorites } from "@/lib/favorites";

type FilterKey = "all" | "popular" | "new" | "favorites";

export function GalleryGrid({
  designs,
  locale,
}: {
  designs: GalleryDesign[];
  locale: string;
}) {
  const t = useTranslations("Gallery");
  const [filter, setFilter] = useState<FilterKey>("all");
  const { favorites, toggleFavorite, loaded } = useFavorites();

  const filtered = useMemo(() => {
    switch (filter) {
      case "popular":
        return designs.filter((d) => d.isPopular);
      case "new":
        return designs.filter((d) => d.isNew);
      case "favorites":
        return designs.filter((d) => favorites.has(d.id));
      default:
        return designs;
    }
  }, [designs, filter, favorites]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "popular", label: t("filterPopular") },
    { key: "new", label: t("filterNew") },
    { key: "favorites", label: t("filterFavorites") },
  ];

  return (
    <div>
      <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "border-brand-900 bg-brand-900 text-white"
                : "border-border bg-surface text-foreground/70 hover:border-brand-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "favorites" && loaded && filtered.length === 0 ? (
        <p className="py-12 text-center text-foreground/60">{t("noFavorites")}</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-foreground/60">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              locale={locale}
              isFavorite={favorites.has(design.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
