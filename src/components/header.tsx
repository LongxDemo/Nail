import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { navItems } from "./nav-items";
import { LanguageSwitcher } from "./language-switcher";
import { siteConfig } from "@/lib/site-config";

export function Header() {
  const t = useTranslations("Nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl font-semibold text-brand-700">
          {siteConfig.shortName}
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-brand-600"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}
