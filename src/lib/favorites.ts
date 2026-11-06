"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bloom_favorites";

function readStoredFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Reading localStorage during the initial render would mismatch the
    // server-rendered (storage-less) HTML, so this syncs in post-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(new Set(readStoredFavorites()));
    setLoaded(true);
  }, []);

  const toggleFavorite = useCallback((designId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(designId)) next.delete(designId);
      else next.add(designId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { favorites, toggleFavorite, loaded };
}
