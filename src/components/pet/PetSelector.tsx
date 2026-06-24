"use client";

import { useEffect } from "react";
import { usePets } from "@/contexts/PetContext";
import { Select } from "@/components/ui/Input";

interface PetSelectorProps {
  value: string;
  onChange: (petId: string) => void;
  label?: string;
}

export function PetSelector({
  value,
  onChange,
  label = "반려동물",
}: PetSelectorProps) {
  const { pets, loading } = usePets();

  useEffect(() => {
    if (!value && pets[0]) {
      onChange(pets[0].id);
    }
  }, [pets, value, onChange]);

  if (loading) {
    return <p className="text-sm text-stone-500">반려동물 불러오는 중...</p>;
  }

  if (pets.length === 0) {
    return (
      <p className="text-sm text-amber-700">
        등록된 반려동물이 없습니다. 먼저 반려동물을 등록해 주세요.
      </p>
    );
  }

  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={pets.map((p) => ({
        value: p.id,
        label: `${p.name} (${p.species === "dog" ? "강아지" : p.species === "cat" ? "고양이" : "기타"})`,
      }))}
    />
  );
}
