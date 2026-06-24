import fs from "fs/promises";
import path from "path";
import { Redis } from "@upstash/redis";
import {
  assertStorageReady,
  getDbDir,
  getRedisEnv,
  useRedisStorage,
} from "@/lib/db/config";

const REDIS_PREFIX = "pawinsight:db:";

interface TableCacheEntry {
  mtimeMs: number;
  data: unknown[];
}

const tableCache = new Map<string, TableCacheEntry>();
let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    const env = getRedisEnv();
    if (!env) throw new Error("Redis is not configured.");
    redisClient = new Redis({ url: env.url, token: env.token });
  }
  return redisClient;
}

async function readTableFile<T>(name: string): Promise<T[]> {
  const filePath = path.join(getDbDir(), `${name}.json`);
  try {
    const stat = await fs.stat(filePath);
    const cached = tableCache.get(name);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.data as T[];
    }
    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw) as T[];
    tableCache.set(name, { mtimeMs: stat.mtimeMs, data });
    return data;
  } catch {
    return [];
  }
}

async function writeTableFile<T>(name: string, rows: T[]): Promise<void> {
  const dir = getDbDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${name}.json`);
  await fs.writeFile(filePath, JSON.stringify(rows, null, 2), "utf-8");
  tableCache.delete(name);
}

async function readTableRedis<T>(name: string): Promise<T[]> {
  const data = await getRedis().get<T[]>(`${REDIS_PREFIX}${name}`);
  return data ?? [];
}

async function writeTableRedis<T>(name: string, rows: T[]): Promise<void> {
  await getRedis().set(`${REDIS_PREFIX}${name}`, rows);
}

export async function readTable<T>(name: string): Promise<T[]> {
  assertStorageReady();
  if (useRedisStorage()) {
    return readTableRedis<T>(name);
  }
  return readTableFile<T>(name);
}

export async function writeTable<T>(name: string, rows: T[]): Promise<void> {
  assertStorageReady();
  if (useRedisStorage()) {
    await writeTableRedis(name, rows);
    return;
  }
  await writeTableFile(name, rows);
}

export { assertStorageReady, useRedisStorage };
