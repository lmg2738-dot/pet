import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  listAnalysisResults,
  listPets,
  getPetMap,
} from "@/lib/db/store";
import { getOwnerIdFromRequest } from "@/lib/session";
import type { AnalysisResult } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("pet_id");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
  const ownerId = getOwnerIdFromRequest(request);

  if (petId && !/^[0-9a-f-]{36}$/i.test(petId)) {
    return jsonError("Invalid pet_id.");
  }

  const pets = await listPets(ownerId);
  if (petId && !pets.some((p) => p.id === petId)) {
    return jsonError("Pet not found.", 404);
  }

  const petMap = await getPetMap(ownerId);
  const analyses = await listAnalysisResults(ownerId, petId ?? undefined, limit);

  return jsonSuccess({
    analyses: analyses.map((analysis) => ({
      ...analysis,
      pet_name: petMap.get(analysis.pet_id) ?? "",
    })) as (AnalysisResult & { pet_name: string })[],
  });
}
