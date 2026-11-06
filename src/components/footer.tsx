import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/lib/site-config";

export function Footer() {
  const t = useTranslations("Nav");

  return (
    <footer className="border-t border-border bg-surface px-4 py-8 text-sm text-foreground/70">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg text-brand-700">{siteConfig.shortName}</p>
          <p>{siteConfig.address}</p>
          <p>{siteConfig.phone}</p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/about" className="hover:text-brand-600">
            {t("about")}
          </Link>
          <a href={siteConfig.socials.instagram} className="hover:text-brand-600">
            Instagram
          </a>
          <a href={siteConfig.socials.facebook} className="hover:text-brand-600">
            Facebook
          </a>
        </nav>
      </div>
    </footer>
  );
}
