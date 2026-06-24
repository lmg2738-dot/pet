"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Camera,
  ClipboardList,
  Database,
  Heart,
  Home,
  PawPrint,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: Home },
  { href: "/dashboard/pets", label: "반려동물", icon: PawPrint },
  { href: "/dashboard/analyze", label: "건강 분석", icon: Camera },
  { href: "/dashboard/records", label: "건강 기록", icon: ClipboardList },
  { href: "/dashboard/report", label: "건강 리포트", icon: BarChart3 },
  { href: "/dashboard/datasets", label: "AI Hub 데이터", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 p-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <Heart className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-stone-900">PawInsight AI</p>
            <p className="text-xs text-stone-500">반려동물 건강 도우미</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-amber-50 text-amber-700"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 p-4">
        <p className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          본 서비스는 수의학적 진단이 아닙니다. 건강 이상 시 수의사와 상담하세요.
        </p>
      </div>
    </aside>
  );
}
