import fs from "fs/promises";
import path from "path";

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

export async function blockModel(modelId: string): Promise<void> {
  const blocklist = await readBlocklist();
  if (blocklist.has(modelId)) return;

  blocklist.add(modelId);
  await fs.mkdir(path.dirname(BLOCKLIST_PATH), { recursive: true });
  await fs.writeFile(
    BLOCKLIST_PATH,
    JSON.stringify([...blocklist], null, 2),
    "utf-8"
  );
  blocklistCache = blocklist;
}

function parsePrice(value: string | number | undefined): number {
  if (value === undefined) return Infinity;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : Infinity;
}

function isFreeModel(model: OpenRouterModelInfo): boolean {
  return model.promptPrice === 0 && model.completionPrice === 0;
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

export async function getFreeVisionModels(): Promise<OpenRouterModelInfo[]> {
  const now = Date.now();
  if (!modelsCache || now - modelsCache.fetchedAt > CACHE_TTL_MS) {
    modelsCache = { fetchedAt: now, models: await fetchAllModels() };
  }

  const blocklist = await readBlocklist();

  return modelsCache.models.filter(
    (m) => isFreeModel(m) && supportsVision(m) && !blocklist.has(m.id)
  );
}

export function isModelUnavailableError(error: unknown): boolean {
  const msg = (
    error instanceof Error ? error.message : String(error)
  ).toLowerCase();

  return (
    msg.includes("no endpoints found") ||
    msg.includes("does not exist") ||
    msg.includes("no longer") ||
    msg.includes("invalid model") ||
    msg.includes("model not available") ||
    (msg.includes("model") && msg.includes("not found"))
  );
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
