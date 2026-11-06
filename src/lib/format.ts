export type NailShape = "round" | "oval" | "almond" | "square" | "coffin" | "stiletto";
export type NailLength = "short" | "medium" | "long";

export function localize(locale: string, en: string, km: string | null | undefined) {
  return locale === "km" && km ? km : en;
}

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function isRecentlyAdded(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < NEW_WINDOW_MS;
}

export function timestamp(): number {
  return Date.now();
}
