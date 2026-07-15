import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AdminPageBannerProps {
  title: string;
  description: ReactNode;
  variant?: "default" | "warning" | "success";
  className?: string;
}

/**
 * Banner explicativo no topo de cada página do painel admin.
 * Explica em linguagem de dono de negócio o que a tela faz.
 */
export function AdminPageBanner({
  title,
  description,
  variant = "default",
  className,
}: AdminPageBannerProps) {
  const styles = {
    default:
      "border-primary/20 bg-primary/5 text-foreground [&_svg]:text-primary",
    warning:
      "border-amber-500/30 bg-amber-500/10 text-foreground [&_svg]:text-amber-600",
    success:
      "border-emerald-500/30 bg-emerald-500/10 text-foreground [&_svg]:text-emerald-600",
  }[variant];

  return (
    <div
      className={cn(
        "mx-4 md:mx-6 mt-4 rounded-lg border px-4 py-3 flex gap-3 items-start",
        styles,
        className,
      )}
    >
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 text-sm leading-relaxed">
        <div className="font-semibold">{title}</div>
        <div className="text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
