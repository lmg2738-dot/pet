"use client";

import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { HealthRecordForm } from "@/components/health/HealthRecordForm";
import { PetSelector } from "@/components/pet/PetSelector";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { HealthRecord } from "@/types/database";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const typeLabels = {
  weight: "체중",
  vaccination: "예방접종",
  memo: "메모",
};

export default function RecordsPage() {
  const { fetchApi } = useApi();
  const [petId, setPetId] = useState("");
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    if (!petId) return;
    setLoading(true);
    try {
      const data = await fetchApi<{ records: HealthRecord[] }>(
        `/api/health-records?pet_id=${petId}`
      );
      setRecords(data.records);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, petId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">건강 기록</h1>
        <p className="mt-1 text-stone-500">
          체중, 예방접종, 메모를 기록하고 관리하세요
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <HealthRecordForm onSuccess={() => loadRecords()} />

        <div className="space-y-4">
          <PetSelector value={petId} onChange={setPetId} label="기록 조회" />

          <Card>
            <CardHeader>
              <CardTitle>기록 목록</CardTitle>
            </CardHeader>

            {loading ? (
              <p className="text-sm text-stone-500">불러오는 중...</p>
            ) : records.length > 0 ? (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-stone-100 bg-stone-50 p-4"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <Badge>{typeLabels[record.record_type]}</Badge>
                      <span className="text-xs text-stone-400">
                        {format(new Date(record.recorded_at), "yyyy.MM.dd", {
                          locale: ko,
                        })}
                      </span>
                    </div>
                    <p className="font-medium text-stone-900">{record.title}</p>
                    {record.value && (
                      <p className="text-sm text-stone-600">{record.value}</p>
                    )}
                    {record.notes && (
                      <p className="mt-1 text-sm text-stone-400">
                        {record.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-stone-400">
                {petId ? "기록이 없습니다." : "반려동물을 선택해 주세요."}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
