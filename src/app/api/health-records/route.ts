import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import {
  listHealthRecords,
  createHealthRecord,
  getPet,
} from "@/lib/db/store";
import { getOwnerIdFromRequest } from "@/lib/session";
import { createHealthRecordSchema } from "@/lib/validations";
import type { HealthRecord } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("pet_id");
  const ownerId = getOwnerIdFromRequest(request);

  if (petId && !/^[0-9a-f-]{36}$/i.test(petId)) {
    return jsonError("Invalid pet_id.");
  }

  if (petId) {
    const pet = await getPet(ownerId, petId);
    if (!pet) return jsonError("Pet not found.", 404);
  }

  const records = await listHealthRecords(ownerId, petId ?? undefined);
  return jsonSuccess({ records: records as HealthRecord[] });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const parsed = createHealthRecordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input.");
  }

  const ownerId = getOwnerIdFromRequest(request);

  try {
    const record = await createHealthRecord(ownerId, parsed.data);
    return jsonSuccess({ record: record as HealthRecord }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save.";
    return jsonError(message, err instanceof Error && message.includes("not found") ? 404 : 500);
  }
}
