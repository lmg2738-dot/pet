"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import { AlertTriangle, CheckCircle, Stethoscope } from "lucide-react";
import type { AnalysisResult, StatusDetail } from "@/types/database";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const categories = [
  { key: "eye_status" as const, label: "눈", emoji: "👁️" },
  { key: "skin_status" as const, label: "피부", emoji: "🐾" },
  { key: "ear_status" as const, label: "귀", emoji: "👂" },
  { key: "body_status" as const, label: "체형", emoji: "📐" },
  { key: "behavior_status" as const, label: "행동", emoji: "🏃" },
];

function StatusItem({
  label,
  emoji,
  detail,
}: {
  label: string;
  emoji: string;
  detail: StatusDetail;
}) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
          <span>{emoji}</span>
          {label}
        </span>
        <span className="text-xs text-stone-400">
          신뢰도 {Math.round(detail.confidence * 100)}%
        </span>
      </div>
      <p className="font-medium text-stone-900">{detail.status}</p>
      <p className="mt-1 text-sm text-stone-500">{detail.notes}</p>
    </div>
  );
}

export function AnalysisResultCard({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-4">
          {analysis.veterinary_recommended ? (
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          )}
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-stone-900">분석 결과</h3>
              <RiskBadge level={analysis.risk_level} />
              {analysis.veterinary_recommended && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  <Stethoscope className="h-3 w-3" />
                  병원 방문 권장
                </span>
              )}
            </div>
            <p className="text-stone-700">{analysis.overall_summary}</p>
            <p className="mt-2 text-xs text-stone-400">
              {format(new Date(analysis.created_at), "yyyy년 M월 d일 HH:mm", {
                locale: ko,
              })}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ key, label, emoji }) => (
          <StatusItem
            key={key}
            label={label}
            emoji={emoji}
            detail={analysis[key]}
          />
        ))}
      </div>

      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>권장 사항</CardTitle>
          </CardHeader>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-stone-700"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="rounded-xl bg-stone-100 p-4 text-xs leading-relaxed text-stone-500">
        ⚠️ 본 분석은 AI 기반 관찰 결과이며 수의학적 진단이 아닙니다. 반려동물의
        건강 상태에 대한 최종 판단은 반드시 수의사와 상담하시기 바랍니다.
      </p>
    </div>
  );
}
