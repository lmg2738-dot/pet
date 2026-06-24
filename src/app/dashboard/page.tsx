"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { DashboardStats } from "@/types/database";
import {
  Activity,
  AlertTriangle,
  Camera,
  PawPrint,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function DashboardPage() {
  const { fetchApi } = useApi();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<DashboardStats>("/api/dashboard")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [fetchApi]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">대시보드</h1>
          <p className="mt-1 text-stone-500">
            반려동물 건강 상태를 한눈에 확인하세요
          </p>
        </div>
        <Link href="/dashboard/analyze">
          <Button>
            <Camera className="h-4 w-4" />
            건강 분석하기
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="등록된 반려동물"
          value={stats?.totalPets ?? 0}
          icon={PawPrint}
          accent="amber"
        />
        <StatsCard
          title="총 분석 횟수"
          value={stats?.totalAnalyses ?? 0}
          icon={Activity}
          accent="blue"
        />
        <StatsCard
          title="주간 분석"
          value={stats?.weeklyAnalysisCount ?? 0}
          subtitle="최근 7일"
          icon={Camera}
          accent="emerald"
        />
        <StatsCard
          title="병원 방문 권장"
          value={stats?.vetRecommendedCount ?? 0}
          icon={Stethoscope}
          accent="red"
        />
      </div>

      {stats?.totalPets === 0 && (
        <Card className="border-amber-200 bg-amber-50 text-center">
          <PawPrint className="mx-auto mb-3 h-10 w-10 text-amber-500" />
          <h3 className="font-semibold text-stone-900">
            반려동물을 등록해 주세요
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            반려동물을 등록하면 AI 건강 분석을 시작할 수 있습니다.
          </p>
          <Link href="/dashboard/pets" className="mt-4 inline-block">
            <Button>반려동물 등록하기</Button>
          </Link>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>최근 분석 기록</CardTitle>
        </CardHeader>

        {stats?.recentAnalyses && stats.recentAnalyses.length > 0 ? (
          <div className="space-y-3">
            {stats.recentAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 p-4"
              >
                <div className="flex items-center gap-3">
                  {analysis.veterinary_recommended && (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {analysis.overall_summary}
                    </p>
                    <p className="text-xs text-stone-400">
                      {format(
                        new Date(analysis.created_at),
                        "yyyy.MM.dd HH:mm",
                        { locale: ko }
                      )}
                    </p>
                  </div>
                </div>
                <RiskBadge level={analysis.risk_level} />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-stone-400">
            아직 분석 기록이 없습니다.
          </p>
        )}
      </Card>
    </div>
  );
}
