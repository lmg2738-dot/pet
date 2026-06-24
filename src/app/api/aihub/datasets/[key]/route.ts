import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { isAihubConfigured } from "@/lib/aihub/config";
import { listDatasetFiles } from "@/lib/aihub/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  if (!isAihubConfigured()) {
    return jsonError("AI Hub API key가 설정되지 않았습니다.", 503);
  }

  const { key } = await params;
  const datasetKey = parseInt(key, 10);

  if (Number.isNaN(datasetKey) || datasetKey <= 0) {
    return jsonError("유효하지 않은 datasetkey입니다.");
  }

  try {
    const files = await listDatasetFiles(datasetKey);
    return jsonSuccess({ datasetKey, files, total: files.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "파일 목록 조회 실패";
    return jsonError(message, 502);
  }
}
