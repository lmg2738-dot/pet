import fs from "fs/promises";
import path from "path";
import {
  isExcludedModel,
  isStrictFreeModel,
  sortModelsByPriority,
} from "@/lib/openrouter/errors";

const BLOCKLIST_PATH = path.join(process.cwd(), "data", "blocked-models.json");
const CACHE_TTL_MS = 5 * 60 * 1000;

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  inputModalities: string[];
  promptPrice: number;
  completionPrice: number;
}

interface ModelsCache {
  fetchedAt: number;
  models: OpenRouterModelInfo[];
}

let modelsCache: ModelsCache | null = null;
let blocklistCache: Set<string> | null = null;
let blocklistCacheMtime = 0;

/** 당일 rate limit 걸린 모델 (다음날 자동 해제) */
const rateLimitedToday = new Map<string, string>();

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function markRateLimited(modelId: string): void {
  rateLimitedToday.set(modelId, todayKey());
}

export function isRateLimitedToday(modelId: string): boolean {
  return rateLimitedToday.get(modelId) === todayKey();
}

async function readBlocklist(): Promise<Set<string>> {
  try {
    const stat = await fs.stat(BLOCKLIST_PATH);
    if (blocklistCache && stat.mtimeMs === blocklistCacheMtime) {
      return blocklistCache;
    }
    const raw = await fs.readFile(BLOCKLIST_PATH, "utf-8");
    blocklistCache = new Set(JSON.parse(raw) as string[]);
    blocklistCacheMtime = stat.mtimeMs;
    return blocklistCache;
  } catch {
    blocklistCache = new Set();
    blocklistCacheMtime = 0;
    return blocklistCache;
  }
}

/** 유료·사용불가 모델 영구 제외 */
export async function blockModelPermanently(modelId: string): Promise<void> {
  const blocklist = await readBlocklist();
  if (blocklist.has(modelId)) return;

  blocklist.add(modelId);
  blocklistCache = blocklist;

  try {
    await fs.mkdir(path.dirname(BLOCKLIST_PATH), { recursive: true });
    await fs.writeFile(
      BLOCKLIST_PATH,
      JSON.stringify([...blocklist], null, 2),
      "utf-8"
    );
  } catch {
    // Vercel: 메모리 blocklist만 사용
  }
}

function parsePrice(value: string | number | undefined): number {
  if (value === undefined) return Infinity;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : Infinity;
}

function supportsVision(model: OpenRouterModelInfo): boolean {
  return model.inputModalities.includes("image");
}

async function fetchAllModels(): Promise<OpenRouterModelInfo[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter models API failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      name?: string;
      pricing?: { prompt?: string; completion?: string };
      architecture?: { input_modalities?: string[] };
    }>;
  };

  return (json.data ?? []).map((m) => ({
    id: m.id,
    name: m.name ?? m.id,
    inputModalities: m.architecture?.input_modalities ?? ["text"],
    promptPrice: parsePrice(m.pricing?.prompt),
    completionPrice: parsePrice(m.pricing?.completion),
  }));
}

function getConfiguredModel(): OpenRouterModelInfo | null {
  const configured = process.env.OPENROUTER_VISION_MODEL?.trim();
  if (!configured) return null;

  if (!configured.includes(":free")) {
    console.warn(
      `[OpenRouter] OPENROUTER_VISION_MODEL="${configured}" is not a :free model. Paid usage may occur.`
    );
  }

  return {
    id: configured,
    name: configured,
    inputModalities: ["image", "text"],
    promptPrice: 0,
    completionPrice: 0,
  };
}

export async function getFreeVisionModels(): Promise<OpenRouterModelInfo[]> {
  const configured = getConfiguredModel();
  if (configured && !isRateLimitedToday(configured.id)) {
    return [configured];
  }

  const now = Date.now();
  if (!modelsCache || now - modelsCache.fetchedAt > CACHE_TTL_MS) {
    modelsCache = { fetchedAt: now, models: await fetchAllModels() };
  }

  const blocklist = await readBlocklist();

  const filtered = modelsCache.models.filter(
    (m) =>
      isStrictFreeModel(m.id, m.promptPrice, m.completionPrice) &&
      supportsVision(m) &&
      !isExcludedModel(m.id) &&
      !blocklist.has(m.id) &&
      !isRateLimitedToday(m.id)
  );

  return sortModelsByPriority(filtered);
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function getOpenRouterApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인하세요."
    );
  }
  return key;
}
