import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { isAihubConfigured } from "@/lib/aihub/config";
import { listDatapackages } from "@/lib/aihub/client";
import { filterDatasets } from "@/lib/aihub/parse";

export async function GET(request: NextRequest) {
  if (!isAihubConfigured()) {
    return jsonError("AI Hub API key가 설정되지 않았습니다.", 503);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;

  try {
    const packages = await listDatapackages();
    const filtered = filterDatasets(packages, query);
    return jsonSuccess({ packages: filtered, total: filtered.length });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "데이터패키지 조회 실패";
    return jsonError(message, 502);
  }
}
