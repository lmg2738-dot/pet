"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { PetSelector } from "@/components/pet/PetSelector";
import type { CreateHealthRecordInput, HealthRecord } from "@/types/database";

interface HealthRecordFormProps {
  onSuccess?: (record: HealthRecord) => void;
}

export function HealthRecordForm({ onSuccess }: HealthRecordFormProps) {
  const { fetchApi } = useApi();
  const [petId, setPetId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Omit<CreateHealthRecordInput, "pet_id">>({
    record_type: "weight",
    title: "",
    value: "",
    recorded_at: new Date().toISOString().split("T")[0],
    notes: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!petId) {
      setError("반려동물을 선택해 주세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await fetchApi<{ record: HealthRecord }>(
        "/api/health-records",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, pet_id: petId }),
        }
      );

      setForm({
        record_type: "weight",
        title: "",
        value: "",
        recorded_at: new Date().toISOString().split("T")[0],
        notes: "",
      });
      onSuccess?.(data.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const recordTypeLabels = {
    weight: "체중",
    vaccination: "예방접종",
    memo: "메모",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>건강 기록 추가</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <PetSelector value={petId} onChange={setPetId} />

        <Select
          label="기록 유형"
          value={form.record_type}
          onChange={(e) =>
            setForm({
              ...form,
              record_type: e.target.value as CreateHealthRecordInput["record_type"],
              title: recordTypeLabels[e.target.value as keyof typeof recordTypeLabels] ?? "",
            })
          }
          options={[
            { value: "weight", label: "체중" },
            { value: "vaccination", label: "예방접종" },
            { value: "memo", label: "메모" },
          ]}
        />

        <Input
          label="제목"
          required
          maxLength={200}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={
            form.record_type === "weight"
              ? "체중 측정"
              : form.record_type === "vaccination"
                ? "종합백신 접종"
                : "건강 메모"
          }
        />

        <Input
          label={
            form.record_type === "weight"
              ? "체중 (kg)"
              : form.record_type === "vaccination"
                ? "백신 종류"
                : "내용"
          }
          maxLength={500}
          value={form.value ?? ""}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
        />

        <Input
          label="기록일"
          type="date"
          value={form.recorded_at ?? ""}
          onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
        />

        <Textarea
          label="메모"
          rows={3}
          maxLength={2000}
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="추가 메모..."
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          저장하기
        </Button>
      </form>
    </Card>
  );
}
