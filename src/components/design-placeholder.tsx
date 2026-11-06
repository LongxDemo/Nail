import { Sparkle } from "lucide-react";

// Placeholder artwork until the salon uploads real photos per design via the
// admin panel (Manage Designs > images). Tinted with the design's swatch color.
export function DesignPlaceholder({
  color,
  className,
}: {
  color?: string;
  className?: string;
}) {
  const hex = color ?? "#f08aa3";
  return (
    <div
      className={`flex items-center justify-center ${className ?? ""}`}
      style={{
        background: `linear-gradient(135deg, ${hex}99, ${hex})`,
      }}
    >
      <Sparkle className="h-8 w-8 text-white/90" strokeWidth={1.5} />
    </div>
  );
}
