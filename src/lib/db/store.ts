import { randomUUID } from "crypto";
import type {
  AnalysisResult,
  CreateHealthRecordInput,
  CreatePetInput,
  DashboardStats,
  HealthRecord,
  Pet,
} from "@/types/database";
import { subDays, subMonths } from "date-fns";
import { readTable, writeTable } from "@/lib/db/adapter";

function sortByDateDesc<T extends { created_at?: string; recorded_at?: string }>(
  items: T[],
  field: "created_at" | "recorded_at"
): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(b[field] ?? 0).getTime() - new Date(a[field] ?? 0).getTime()
  );
}

async function getOwnerPets(ownerId: string): Promise<Pet[]> {
  const pets = await readTable<Pet>("pets");
  return sortByDateDesc(
    pets.filter((p) => p.owner_id === ownerId),
    "created_at"
  );
}

function resolvePetIds(
  ownerPetIds: Set<string>,
  petId?: string
): Set<string> | null {
  if (petId) return ownerPetIds.has(petId) ? new Set([petId]) : null;
  return ownerPetIds;
}

// --- Pets ---

export async function listPets(ownerId: string): Promise<Pet[]> {
  return getOwnerPets(ownerId);
}

export async function getPet(
  ownerId: string,
  petId: string
): Promise<Pet | null> {
  const pets = await getOwnerPets(ownerId);
  return pets.find((p) => p.id === petId) ?? null;
}

export async function createPet(
  ownerId: string,
  input: CreatePetInput
): Promise<Pet> {
  const pets = await readTable<Pet>("pets");
  const now = new Date().toISOString();
  const pet: Pet = {
    id: randomUUID(),
    owner_id: ownerId,
    name: input.name,
    species: input.species,
    breed: input.breed ?? null,
    birth_date: input.birth_date ?? null,
    weight_kg: input.weight_kg ?? null,
    profile_image_url: null,
    created_at: now,
    updated_at: now,
  };
  pets.push(pet);
  await writeTable("pets", pets);
  return pet;
}

// --- Health Records ---

export async function listHealthRecords(
  ownerId: string,
  petId?: string
): Promise<HealthRecord[]> {
  const ownerPets = await getOwnerPets(ownerId);
  const targetIds = resolvePetIds(new Set(ownerPets.map((p) => p.id)), petId);
  if (!targetIds || targetIds.size === 0) return [];

  const records = await readTable<HealthRecord>("health_records");
  return sortByDateDesc(
    records.filter((r) => targetIds.has(r.pet_id)),
    "recorded_at"
  );
}

export async function createHealthRecord(
  ownerId: string,
  input: CreateHealthRecordInput
): Promise<HealthRecord> {
  const pet = await getPet(ownerId, input.pet_id);
  if (!pet) throw new Error("Pet not found.");

  const records = await readTable<HealthRecord>("health_records");
  const record: HealthRecord = {
    id: randomUUID(),
    pet_id: input.pet_id,
    record_type: input.record_type,
    title: input.title,
    value: input.value ?? null,
    recorded_at: input.recorded_at ?? new Date().toISOString().split("T")[0],
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
  };
  records.push(record);
  await writeTable("health_records", records);
  return record;
}

// --- Analysis Results ---

export async function listAnalysisResults(
  ownerId: string,
  petId?: string,
  limit = 100
): Promise<AnalysisResult[]> {
  const ownerPets = await getOwnerPets(ownerId);
  const targetIds = resolvePetIds(new Set(ownerPets.map((p) => p.id)), petId);
  if (!targetIds || targetIds.size === 0) return [];

  const results = await readTable<AnalysisResult>("analysis_results");
  return sortByDateDesc(
    results.filter((r) => targetIds.has(r.pet_id)),
    "created_at"
  ).slice(0, limit);
}

export async function createAnalysisResult(
  ownerId: string,
  petId: string,
  data: Omit<AnalysisResult, "id" | "pet_id" | "created_at"> & {
    raw_response?: unknown;
  }
): Promise<AnalysisResult> {
  const pet = await getPet(ownerId, petId);
  if (!pet) throw new Error("Pet not found.");

  const results = await readTable<AnalysisResult & { raw_response?: unknown }>(
    "analysis_results"
  );
  const result: AnalysisResult & { raw_response?: unknown } = {
    id: randomUUID(),
    pet_id: petId,
    created_at: new Date().toISOString(),
    ...data,
  };
  results.push(result);
  await writeTable("analysis_results", results);
  return result;
}

export async function getDashboardStats(
  ownerId: string,
  petId?: string
): Promise<DashboardStats> {
  const ownerPets = await getOwnerPets(ownerId);
  const petIds = new Set(ownerPets.map((p) => p.id));

  if (petIds.size === 0) {
    return {
      totalPets: 0,
      totalAnalyses: 0,
      recentAnalyses: [],
      vetRecommendedCount: 0,
      weeklyAnalysisCount: 0,
      monthlyAnalysisCount: 0,
    };
  }

  if (petId && !petIds.has(petId)) {
    throw new Error("Pet not found.");
  }

  const targetIds = petId ? new Set([petId]) : petIds;
  const weekAgo = subDays(new Date(), 7).getTime();
  const monthAgo = subMonths(new Date(), 1).getTime();

  const results = await readTable<AnalysisResult>("analysis_results");
  const filtered = sortByDateDesc(
    results.filter((r) => targetIds.has(r.pet_id)),
    "created_at"
  );

  let vetRecommendedCount = 0;
  let weeklyAnalysisCount = 0;
  let monthlyAnalysisCount = 0;

  for (const a of filtered) {
    const ts = new Date(a.created_at).getTime();
    if (a.veterinary_recommended) vetRecommendedCount++;
    if (ts >= weekAgo) weeklyAnalysisCount++;
    if (ts >= monthAgo) monthlyAnalysisCount++;
  }

  return {
    totalPets: petIds.size,
    totalAnalyses: filtered.length,
    recentAnalyses: filtered.slice(0, 5),
    vetRecommendedCount,
    weeklyAnalysisCount,
    monthlyAnalysisCount,
  };
}

export async function getReportData(
  ownerId: string,
  petId?: string,
  limit = 50
): Promise<{
  stats: DashboardStats;
  analyses: (AnalysisResult & { pet_name: string })[];
}> {
  const ownerPets = await getOwnerPets(ownerId);
  const petMap = new Map(ownerPets.map((p) => [p.id, p.name]));
  const petIds = new Set(ownerPets.map((p) => p.id));

  if (petIds.size === 0) {
    return {
      stats: {
        totalPets: 0,
        totalAnalyses: 0,
        recentAnalyses: [],
        vetRecommendedCount: 0,
        weeklyAnalysisCount: 0,
        monthlyAnalysisCount: 0,
      },
      analyses: [],
    };
  }

  if (petId && !petIds.has(petId)) {
    throw new Error("Pet not found.");
  }

  const targetIds = petId ? new Set([petId]) : petIds;
  const weekAgo = subDays(new Date(), 7).getTime();
  const monthAgo = subMonths(new Date(), 1).getTime();

  const results = await readTable<AnalysisResult>("analysis_results");
  const filtered = sortByDateDesc(
    results.filter((r) => targetIds.has(r.pet_id)),
    "created_at"
  );

  let vetRecommendedCount = 0;
  let weeklyAnalysisCount = 0;
  let monthlyAnalysisCount = 0;

  for (const a of filtered) {
    const ts = new Date(a.created_at).getTime();
    if (a.veterinary_recommended) vetRecommendedCount++;
    if (ts >= weekAgo) weeklyAnalysisCount++;
    if (ts >= monthAgo) monthlyAnalysisCount++;
  }

  return {
    stats: {
      totalPets: petIds.size,
      totalAnalyses: filtered.length,
      recentAnalyses: filtered.slice(0, 5),
      vetRecommendedCount,
      weeklyAnalysisCount,
      monthlyAnalysisCount,
    },
    analyses: filtered.slice(0, limit).map((a) => ({
      ...a,
      pet_name: petMap.get(a.pet_id) ?? "",
    })),
  };
}

export async function getPetMap(
  ownerId: string
): Promise<Map<string, string>> {
  const pets = await getOwnerPets(ownerId);
  return new Map(pets.map((p) => [p.id, p.name]));
}
