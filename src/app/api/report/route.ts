import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getReportData } from "@/lib/db/store";
import { getOwnerIdFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const petId = searchParams.get("pet_id") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const ownerId = getOwnerIdFromRequest(request);

  try {
    const data = await getReportData(ownerId, petId, limit);
    return jsonSuccess(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch report";
    return jsonError(message, message.includes("not found") ? 404 : 500);
  }
}
