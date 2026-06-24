import { Card } from "@/components/ui/Card";
import { PawPrint } from "lucide-react";
import type { Pet } from "@/types/database";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const speciesLabel = {
  dog: "강아지",
  cat: "고양이",
  other: "기타",
};

export function PetCard({ pet }: { pet: Pet }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
        {pet.profile_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pet.profile_image_url}
            alt={pet.name}
            className="h-14 w-14 rounded-2xl object-cover"
          />
        ) : (
          <PawPrint className="h-7 w-7 text-amber-600" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-stone-900">{pet.name}</h3>
        <p className="text-sm text-stone-500">
          {speciesLabel[pet.species]}
          {pet.breed && ` · ${pet.breed}`}
        </p>
        <div className="mt-1 flex gap-3 text-xs text-stone-400">
          {pet.weight_kg && <span>{pet.weight_kg}kg</span>}
          {pet.birth_date && (
            <span>
              {format(new Date(pet.birth_date), "yyyy.MM.dd", { locale: ko })}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
