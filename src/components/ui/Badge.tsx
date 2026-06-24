import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/database";

const riskStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const riskLabels: Record<RiskLevel, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | RiskLevel;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "default"
          ? "bg-stone-100 text-stone-700"
          : riskStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge variant={level}>{riskLabels[level]}</Badge>;
}
