import { Home, Images, Sparkles, CalendarCheck, Star } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "home", icon: Home },
  { href: "/gallery", labelKey: "gallery", icon: Images },
  { href: "/try-on", labelKey: "tryOn", icon: Sparkles },
  { href: "/booking", labelKey: "booking", icon: CalendarCheck },
  { href: "/reviews", labelKey: "reviews", icon: Star },
] as const;
