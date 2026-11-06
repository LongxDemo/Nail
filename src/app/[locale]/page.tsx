import { getTranslations, setRequestLocale } from "next-intl/server";
import { Sparkles, Images, CalendarCheck, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const common = await getTranslations("Common");

  const features = [
    { href: "/gallery", icon: Images, title: t("ctaGallery") },
    { href: "/try-on", icon: Sparkles, title: t("ctaTryOn") },
    { href: "/booking", icon: CalendarCheck, title: t("ctaBook") },
    { href: "/reviews", icon: Star, title: common("viewAll") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <section className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
          {t("heroEyebrow")}
        </span>
        <h1 className="font-display max-w-md text-4xl font-semibold leading-tight text-brand-900">
          {t("heroTitle")}
        </h1>
        <p className="max-w-sm text-balance text-foreground/70">
          {t("heroSubtitle")}
        </p>
        <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/booking"
            className="rounded-full bg-brand-500 px-6 py-3 text-center font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            {t("ctaBook")}
          </Link>
          <Link
            href="/gallery"
            className="rounded-full border border-brand-300 px-6 py-3 text-center font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            {t("ctaGallery")}
          </Link>
        </div>
      </section>

      <section className="py-8">
        <h2 className="font-display mb-4 text-center text-2xl text-brand-900">
          {t("featuresTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {features.map(({ href, icon: Icon, title }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-foreground/80">{title}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
