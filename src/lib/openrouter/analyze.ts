import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { analysisResponseSchema } from "@/lib/validations";
import type { AnalysisResponse } from "@/types/database";
import {
  blockModelPermanently,
  getFreeVisionModels,
  getOpenRouterApiKey,
  isOpenRouterConfigured,
  markRateLimited,
} from "@/lib/openrouter/models";
import {
  isAnalysisMostlyKorean,
  KOREAN_RETRY_INSTRUCTION,
  localizeAnalysisResponse,
} from "@/lib/openrouter/korean";
import {
  buildAllModelsFailedMessage,
  buildRateLimitMessage,
  isInsufficientCreditsError,
  isModelUnavailableError,
  isRateLimitError,
} from "@/lib/openrouter/errors";
import { resolveUploadBuffer } from "@/lib/storage/media";

const ANALYSIS_PROMPT = `당신은 PawInsight AI 반려동물 건강 관찰 도우미입니다.
중요: 수의사가 아닙니다. 진단이 아닌 관찰 정보만 제공합니다.

사진을 분석하여 다음 항목을 평가하세요:
1. 눈 (충혈, 분비물, 맑기)
2. 피부 (건조, 자극, 털 상태)
3. 귀 (청결, 발적, 분비물)
4. 체형 (체중 징후, 자세)
5. 행동 (스트레스, 무기력 등 자세에서 보이는 징후)

【필수】모든 텍스트는 반드시 한국어로만 작성하세요. 영어 사용 금지.
status, notes, overall_summary, recommendations 전부 한국어입니다.

아래 JSON 형식으로만 응답하세요:
{
  "eye_status": { "status": "한국어 상태", "confidence": 0.0-1.0, "notes": "한국어 설명" },
  "skin_status": { "status": "한국어 상태", "confidence": 0.0-1.0, "notes": "한국어 설명" },
  "ear_status": { "status": "한국어 상태", "confidence": 0.0-1.0, "notes": "한국어 설명" },
  "body_status": { "status": "한국어 상태", "confidence": 0.0-1.0, "notes": "한국어 설명" },
  "behavior_status": { "status": "한국어 상태", "confidence": 0.0-1.0, "notes": "한국어 설명" },
  "overall_summary": "한국어 종합 요약",
  "risk_level": "low" | "medium" | "high",
  "veterinary_recommended": true | false,
  "recommendations": ["한국어 권장 사항"]
}

risk_level과 veterinary_recommended만 영어 키워드/불리언을 사용하고, 나머지 모든 값은 한국어입니다.
이상 징후가 중간 이상이면 veterinary_recommended를 true로 설정하세요.
recommendations 마지막 항목에 "본 결과는 수의학적 진단이 아닙니다"를 포함하세요.`;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

let openRouterClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openRouterClient) {
    openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: getOpenRouterApiKey(),
      defaultHeaders: {
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:50004",
        "X-Title": "PawInsight AI",
      },
    });
  }
  return openRouterClient;
}

export function resolveImageUrl(imageUrl: string, baseUrl: string): string {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  if (imageUrl.startsWith("/")) {
    return `${baseUrl.replace(/\/$/, "")}${imageUrl}`;
  }
  return imageUrl;
}

/** 업로드 이미지는 base64로 변환 (OpenRouter가 localhost/비공개 URL 접근 불가) */
export async function resolveImageForVision(
  imageUrl: string,
  baseUrl: string
): Promise<string> {
  const buffer = await resolveUploadBuffer(imageUrl);
  if (buffer) {
    const ext = path.extname(imageUrl.split("?")[0]).slice(1).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  }

  if (imageUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", imageUrl);
    try {
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(imageUrl).slice(1).toLowerCase();
      const mime = MIME_BY_EXT[ext] ?? "image/jpeg";
      return `data:${mime};base64,${fileBuffer.toString("base64")}`;
    } catch {
      // fall through
    }
  }

  const resolved = resolveImageUrl(imageUrl, baseUrl);
  if (resolved.includes("localhost") || resolved.includes("127.0.0.1")) {
    try {
      const url = new URL(resolved);
      const filePath = path.join(process.cwd(), "public", url.pathname);
      const fileBuffer = await fs.readFile(filePath);
      const ext = path.extname(url.pathname).slice(1).toLowerCase();
      const mime = MIME_BY_EXT[ext] ?? "image/jpeg";
      return `data:${mime};base64,${fileBuffer.toString("base64")}`;
    } catch {
      return resolved;
    }
  }

  return resolved;
}

async function requestAnalysis(
  client: OpenAI,
  modelId: string,
  visionUrl: string,
  petName: string,
  extraInstruction?: string
): Promise<AnalysisResponse> {
  const userText = extraInstruction
    ? `${petName}의 사진을 분석해 주세요. 관찰 정보만 제공하세요.\n${extraInstruction}`
    : `${petName}의 사진을 분석해 주세요. 모든 결과를 한국어로만 작성하고, 관찰 정보만 제공하세요.`;

  const response = await client.chat.completions.create({
    model: modelId,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: visionUrl } },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response");

  const parsed = JSON.parse(content);
  const validated = analysisResponseSchema.parse(parsed);
  return localizeAnalysisResponse(validated);
}

export async function analyzePetImage(
  imageUrl: string,
  petName: string,
  baseUrl: string
): Promise<
  AnalysisResponse & { raw_response: unknown; model_used: string }
> {
  const client = getClient();
  const visionUrl = await resolveImageForVision(imageUrl, baseUrl);
  const models = await getFreeVisionModels();

  if (models.length === 0) {
    throw new Error(
      "사용 가능한 무료 Vision 모델이 없습니다. OpenRouter 무료 모델 목록을 확인하세요."
    );
  }

  const errors: string[] = [];
  let rateLimitCount = 0;

  for (const model of models) {
    try {
      let result = await requestAnalysis(
        client,
        model.id,
        visionUrl,
        petName
      );

      if (!isAnalysisMostlyKorean(result)) {
        try {
          result = await requestAnalysis(
            client,
            model.id,
            visionUrl,
            petName,
            KOREAN_RETRY_INSTRUCTION
          );
        } catch (retryErr) {
          if (isRateLimitError(retryErr)) {
            markRateLimited(model.id);
            rateLimitCount++;
            errors.push(`${model.id}: 일일 한도 초과 (429)`);
            continue;
          }
          throw retryErr;
        }
      }

      return {
        ...result,
        raw_response: { ...result, _model: model.id },
        model_used: model.id,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${model.id}: ${message}`);

      if (isRateLimitError(err)) {
        markRateLimited(model.id);
        rateLimitCount++;
        continue;
      }

      if (isInsufficientCreditsError(err)) {
        await blockModelPermanently(model.id);
        continue;
      }

      if (isModelUnavailableError(err)) {
        await blockModelPermanently(model.id);
        continue;
      }
    }
  }

  if (rateLimitCount > 0 && rateLimitCount === models.length) {
    throw new Error(buildRateLimitMessage(models.length));
  }

  throw new Error(buildAllModelsFailedMessage(errors));
}

export { isOpenRouterConfigured };
