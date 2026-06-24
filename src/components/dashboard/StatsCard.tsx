import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: "amber" | "emerald" | "red" | "blue";
}

const accentStyles = {
  amber: "bg-amber-100 text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = "amber",
}: StatsCardProps) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm text-stone-500">{title}</p>
        <p className="mt-1 text-3xl font-bold text-stone-900">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-stone-400">{subtitle}</p>
        )}
      </div>
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          accentStyles[accent]
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
    </Card>
  );
}
