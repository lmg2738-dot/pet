/** OpenRouter 무료 Vision 모델 우선순위 (pet 이미지 분석에 적합) */
export const PRIORITY_FREE_VISION_MODELS = [
  "google/gemma-3-27b-it:free",
  "qwen/qwen2.5-vl-72b-instruct:free",
  "qwen/qwen2.5-vl-32b-instruct:free",
  "meta-llama/llama-4-maverick:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-4b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
] as const;

/** pet 분석에 부적합한 모델 패턴 */
const EXCLUDED_MODEL_PATTERNS = [
  /content-safety/i,
  /lyria/i,
  /whisper/i,
  /embed/i,
  /rerank/i,
  /tts/i,
  /speech/i,
  /moderation/i,
  /reasoning:free$/i,
];

/** 유료·프리뷰 모델 패턴 (:free 없음) */
const PAID_MODEL_PATTERNS = [
  /preview$/i,
  /pro(?!.*:free)/i,
  /-plus(?!.*:free)/i,
  /-max(?!.*:free)/i,
];

export function isExcludedModel(modelId: string): boolean {
  if (EXCLUDED_MODEL_PATTERNS.some((p) => p.test(modelId))) return true;
  if (!modelId.includes(":free")) {
    return PAID_MODEL_PATTERNS.some((p) => p.test(modelId));
  }
  return false;
}

/** 가격 0원 + :free 접미사만 허용 */
export function isStrictFreeModel(
  modelId: string,
  prompt: number,
  completion: number
): boolean {
  if (prompt !== 0 || completion !== 0) return false;
  return modelId.includes(":free");
}

export function sortModelsByPriority<T extends { id: string }>(models: T[]): T[] {
  return [...models].sort((a, b) => {
    const ai = PRIORITY_FREE_VISION_MODELS.indexOf(
      a.id as (typeof PRIORITY_FREE_VISION_MODELS)[number]
    );
    const bi = PRIORITY_FREE_VISION_MODELS.indexOf(
      b.id as (typeof PRIORITY_FREE_VISION_MODELS)[number]
    );
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    return aRank - bRank;
  });
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: unknown }).status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

export function isRateLimitError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  const status = getErrorStatus(err);
  return (
    status === 429 ||
    msg.includes("rate limit") ||
    msg.includes("free-models-per-day") ||
    msg.includes("too many requests")
  );
}

export function isInsufficientCreditsError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  const status = getErrorStatus(err);
  return (
    status === 402 ||
    msg.includes("insufficient credits") ||
    msg.includes("never purchased credits") ||
    msg.includes("payment required")
  );
}

export function isModelUnavailableError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes("no endpoints found") ||
    msg.includes("does not exist") ||
    msg.includes("no longer") ||
    msg.includes("invalid model") ||
    msg.includes("model not available") ||
    (msg.includes("model") && msg.includes("not found"))
  );
}

export function buildRateLimitMessage(triedCount: number): string {
  return (
    `시도한 ${triedCount}개 무료 Vision 모델 모두 일일 한도에 도달했습니다.\n\n` +
    "• 내일 다시 시도해 주세요\n" +
    "• 또는 OpenRouter(https://openrouter.ai/settings/credits)에서 크레딧 충전\n" +
    "• OPENROUTER_VISION_MODEL 환경변수로 특정 무료 모델 지정 가능"
  );
}

export function buildAllModelsFailedMessage(errors: string[]): string {
  const allRateLimited = errors.every(
    (e) =>
      e.toLowerCase().includes("rate limit") ||
      e.includes("429") ||
      e.includes("한도")
  );
  if (allRateLimited) return buildRateLimitMessage(errors.length);

  const preview = errors.slice(0, 3).join("\n");
  return `AI 분석에 실패했습니다.\n\n${preview}`;
}
