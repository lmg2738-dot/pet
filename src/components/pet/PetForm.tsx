"use client";

import { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CreatePetInput, Pet } from "@/types/database";

interface PetFormProps {
  onSuccess?: (pet: Pet) => void;
}

export function PetForm({ onSuccess }: PetFormProps) {
  const { fetchApi } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<CreatePetInput>({
    name: "",
    species: "dog",
    breed: "",
    birth_date: "",
    weight_kg: undefined,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: CreatePetInput = {
        name: form.name,
        species: form.species,
        breed: form.breed || undefined,
        birth_date: form.birth_date || undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      };

      const data = await fetchApi<{ pet: Pet }>("/api/pet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setForm({ name: "", species: "dog", breed: "", birth_date: "", weight_kg: undefined });
      onSuccess?.(data.pet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>반려동물 등록</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="이름"
          required
          maxLength={100}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="예: 뽀미"
        />

        <Select
          label="종류"
          value={form.species}
          onChange={(e) =>
            setForm({
              ...form,
              species: e.target.value as CreatePetInput["species"],
            })
          }
          options={[
            { value: "dog", label: "강아지" },
            { value: "cat", label: "고양이" },
            { value: "other", label: "기타" },
          ]}
        />

        <Input
          label="품종"
          maxLength={100}
          value={form.breed ?? ""}
          onChange={(e) => setForm({ ...form, breed: e.target.value })}
          placeholder="예: 말티즈"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="생년월일"
            type="date"
            value={form.birth_date ?? ""}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          />
          <Input
            label="체중 (kg)"
            type="number"
            step="0.1"
            min="0"
            max="500"
            value={form.weight_kg ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                weight_kg: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="3.5"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          등록하기
        </Button>
      </form>
    </Card>
  );
}
