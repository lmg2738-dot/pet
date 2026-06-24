"use client";

import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { PetSelector } from "@/components/pet/PetSelector";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RiskBadge } from "@/components/ui/Badge";
import type { AnalysisResult, DashboardStats } from "@/types/database";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Stethoscope,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function ReportPage() {
  const { fetchApi } = useApi();
  const [petId, setPetId] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyses, setAnalyses] = useState<
    (AnalysisResult & { pet_name?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (petId) params.set("pet_id", petId);
    params.set("limit", "50");

    fetchApi<{ stats: DashboardStats; analyses: (AnalysisResult & { pet_name: string })[] }>(
      `/api/report?${params}`
    )
      .then((data) => {
        setStats(data.stats);
        setAnalyses(data.analyses);
      })
      .catch(() => {
        setStats(null);
        setAnalyses([]);
      })
      .finally(() => setLoading(false));
  }, [fetchApi, petId]);

  const riskDistribution = useMemo(
    () => ({
      low: analyses.filter((a) => a.risk_level === "low").length,
      medium: analyses.filter((a) => a.risk_level === "medium").length,
      high: analyses.filter((a) => a.risk_level === "high").length,
    }),
    [analyses]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">건강 리포트</h1>
        <p className="mt-1 text-stone-500">
          주간·월간 건강 분석 리포트를 확인하세요
        </p>
      </div>

      <PetSelector value={petId} onChange={setPetId} label="리포트 대상" />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="주간 분석"
              value={stats?.weeklyAnalysisCount ?? 0}
              subtitle="최근 7일"
              icon={Calendar}
              accent="blue"
            />
            <StatsCard
              title="월간 분석"
              value={stats?.monthlyAnalysisCount ?? 0}
              subtitle="최근 30일"
              icon={Activity}
              accent="emerald"
            />
            <StatsCard
              title="병원 권장"
              value={stats?.vetRecommendedCount ?? 0}
              icon={Stethoscope}
              accent="red"
            />
            <StatsCard
              title="총 분석"
              value={stats?.totalAnalyses ?? 0}
              icon={AlertTriangle}
              accent="amber"
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>위험도 분포</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {(
                  [
                    { level: "low" as const, label: "낮음", color: "bg-emerald-500" },
                    { level: "medium" as const, label: "보통", color: "bg-amber-500" },
                    { level: "high" as const, label: "높음", color: "bg-red-500" },
                  ] as const
                ).map(({ level, label, color }) => {
                  const count = riskDistribution[level];
                  const total = analyses.length || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={level}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-stone-600">{label}</span>
                        <span className="font-medium text-stone-900">
                          {count}건 ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div
                          className={`h-full rounded-full ${color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>분석 타임라인</CardTitle>
              </CardHeader>
              {analyses.length > 0 ? (
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-900">
                          {analysis.overall_summary}
                        </p>
                        <p className="text-xs text-stone-400">
                          {format(
                            new Date(analysis.created_at),
                            "yyyy.MM.dd HH:mm",
                            { locale: ko }
                          )}
                          {analysis.pet_name && ` · ${analysis.pet_name}`}
                        </p>
                      </div>
                      <RiskBadge level={analysis.risk_level} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-stone-400">
                  분석 기록이 없습니다.
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
