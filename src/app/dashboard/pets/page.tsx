"use client";

import { PetForm } from "@/components/pet/PetForm";
import { PetCard } from "@/components/pet/PetCard";
import { usePets } from "@/contexts/PetContext";

export default function PetsPage() {
  const { pets, loading, refresh } = usePets();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">반려동물 관리</h1>
        <p className="mt-1 text-stone-500">
          반려동물을 등록하고 프로필을 관리하세요
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <PetForm onSuccess={refresh} />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">
            등록된 반려동물 ({pets.length})
          </h2>

          {loading ? (
            <p className="text-sm text-stone-500">불러오는 중...</p>
          ) : pets.length > 0 ? (
            <div className="space-y-3">
              {pets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-sm text-stone-400">
              등록된 반려동물이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
