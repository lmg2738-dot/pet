import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getDashboardStats } from "@/lib/db/store";
import { getOwnerIdFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("pet_id") ?? undefined;
  const ownerId = getOwnerIdFromRequest(request);

  try {
    const stats = await getDashboardStats(ownerId, petId);
    return jsonSuccess(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return jsonError(message, message.includes("not found") ? 404 : 500);
  }
}
