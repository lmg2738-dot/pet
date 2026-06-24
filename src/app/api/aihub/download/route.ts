import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonSuccess } from "@/lib/api";
import { isAihubConfigured } from "@/lib/aihub/config";
import { downloadFromAihub } from "@/lib/aihub/client";

const downloadSchema = z.object({
  type: z.enum(["dataset", "datapackage"]),
  key: z.number().int().positive(),
  filekeys: z.array(z.number().int().positive()).optional(),
});

export async function POST(request: NextRequest) {
  if (!isAihubConfigured()) {
    return jsonError("AI Hub API key가 설정되지 않았습니다.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const parsed = downloadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input.");
  }

  const { type, key, filekeys } = parsed.data;

  try {
    const result = await downloadFromAihub(type, key, filekeys);

    if (!result.success) {
      return jsonError("다운로드에 실패했습니다. AI Hub 승인 상태를 확인하세요.", 502);
    }

    return jsonSuccess({
      message: "다운로드가 완료되었습니다.",
      downloadDir: result.downloadDir,
      output: result.output.slice(-2000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "다운로드 실패";
    return jsonError(message, 502);
  }
}
