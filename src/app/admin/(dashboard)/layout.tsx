import { redirect } from "next/navigation";
import { LayoutDashboard, CalendarRange, Images, Clock, Star, LogOut, Scissors } from "lucide-react";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { logoutAction } from "@/app/admin/actions";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarRange },
  { href: "/admin/services", label: "Services", icon: Scissors },
  { href: "/admin/designs", label: "Designs", icon: Images },
  { href: "/admin/hours", label: "Hours", icon: Clock },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <p className="font-display text-lg text-brand-700">Bloom Admin</p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-brand-600"
            >
              <LogOut className="h-4 w-4" />
              {admin.email}
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-brand-50 hover:text-brand-700"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
