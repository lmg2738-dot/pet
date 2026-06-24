import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/api";
import { getPet, createAnalysisResult } from "@/lib/db/store";
import {
  analyzePetImage,
  isOpenRouterConfigured,
} from "@/lib/openrouter/analyze";
import { getOwnerIdFromRequest, OWNER_COOKIE } from "@/lib/session";
import { analyzePetSchema } from "@/lib/validations";
import type { AnalysisResult } from "@/types/database";

function getBaseUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    `http://${request.headers.get("host") ?? "localhost:50004"}`
  );
}

export async function POST(request: NextRequest) {
  if (!isOpenRouterConfigured()) {
    return jsonError("OpenRouter API key가 설정되지 않았습니다.", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const parsed = analyzePetSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input.");
  }

  const { pet_id, image_url } = parsed.data;
  const ownerId = getOwnerIdFromRequest(request);
  const pet = await getPet(ownerId, pet_id);

  if (!pet) {
    return jsonError("Pet not found.", 404);
  }

  let analysis;
  try {
    analysis = await analyzePetImage(
      image_url,
      pet.name,
      getBaseUrl(request)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return jsonError(message, 502);
  }

  const { raw_response, model_used, ...resultFields } = analysis;

  try {
    const saved = await createAnalysisResult(ownerId, pet_id, {
      image_url,
      ...resultFields,
      raw_response: { ...(raw_response as object), model_used },
    });

    const response = jsonSuccess({
      analysis: saved as AnalysisResult,
      model_used,
      disclaimer:
        "본 분석은 수의학적 진단이 아닙니다. 건강 이상이 의심되면 반드시 수의사와 상담하세요.",
    });
    response.cookies.set(OWNER_COOKIE, ownerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  } catch {
    return jsonError("Failed to save analysis result.", 500);
  }
}
