import { Badge } from "@/components/ui/badge";

interface AdContainerProps {
  children: React.ReactNode;
  variant?: "homepage" | "results" | "sidebar" | "inline" | "compare";
  className?: string;
}

/**
 * Reusable container for Google AdSense units
 * Provides consistent sunset-branded styling and "Sponsored" labels
 */
export function AdContainer({
  children,
  variant = "inline",
  className = "",
}: AdContainerProps) {
  const styles = {
    homepage:
      "rounded-xl border border-sunset-orange/10 bg-white/80 p-4 shadow-sm backdrop-blur",
    results:
      "rounded-xl border border-sky-blue/20 bg-gradient-to-br from-white/90 to-lavender/10 p-6 shadow-md backdrop-blur",
    sidebar:
      "rounded-xl border border-lavender/30 bg-white/80 p-4 shadow-md backdrop-blur",
    inline: "rounded-xl border border-gray-200 bg-neutral-warm/30 p-5 shadow-sm",
    compare:
      "rounded-xl border border-sunset-orange/10 bg-neutral-warm/50 p-6 shadow-sm",
  };

  return (
    <div
      className={`${styles[variant]} ${className}`}
      role="complementary"
      aria-label="Sponsored content"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Sponsored
        </p>
        <Badge variant="outline" className="text-xs text-gray-500">
          Ad
        </Badge>
      </div>
      {children}
    </div>
  );
}
