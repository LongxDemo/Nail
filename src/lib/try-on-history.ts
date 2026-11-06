"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "bloom_tryon_history";
const MAX_ENTRIES = 20;

export interface TryOnHistoryEntry {
  id: string;
  designId: string;
  designName: string;
  resultUrl: string;
  handPhotoUrl: string;
  shape: string;
  length: string;
  createdAt: number;
}

function readHistory(): TryOnHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TryOnHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function useTryOnHistory() {
  const [history, setHistory] = useState<TryOnHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Post-mount sync from localStorage -- see useFavorites for why this
    // can't happen during the initial render (hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(readHistory());
    setLoaded(true);
  }, []);

  const addEntry = useCallback((entry: TryOnHistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, addEntry, loaded };
}
