"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = { en: "EN", km: "ខ្មែរ" };

export function LanguageSwitcher() {
  const t = useTranslations("Common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-sm">
      <span className="sr-only">{t("language")}</span>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(pathname, { locale: loc })}
          aria-current={loc === locale}
          className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
            loc === locale
              ? "bg-brand-500 text-white"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          {LABELS[loc] ?? loc}
        </button>
      ))}
    </div>
  );
}
