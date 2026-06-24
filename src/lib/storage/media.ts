import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";
import {
  getRedisEnv,
  getUploadDir,
  isVercel,
  useRedisStorage,
} from "@/lib/db/config";

const REDIS_UPLOAD_PREFIX = "pawinsight:upload:";

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    const env = getRedisEnv();
    if (!env) throw new Error("Redis is not configured.");
    redisClient = new Redis({ url: env.url, token: env.token });
  }
  return redisClient;
}

function uploadRedisKey(ownerId: string, petId: string, filename: string): string {
  return `${REDIS_UPLOAD_PREFIX}${ownerId}:${petId}:${filename}`;
}

export function parseMediaPath(pathSegments: string[]): {
  ownerId: string;
  petId: string;
  filename: string;
} | null {
  if (pathSegments.length !== 3) return null;
  const [ownerId, petId, filename] = pathSegments;
  if (!/^[0-9a-f-]{36}$/i.test(ownerId) || !/^[0-9a-f-]{36}$/i.test(petId)) {
    return null;
  }
  return { ownerId, petId, filename };
}

export async function saveUploadToRedis(
  ownerId: string,
  petId: string,
  filename: string,
  buffer: Buffer,
  mime: string
): Promise<void> {
  await getRedis().set(uploadRedisKey(ownerId, petId, filename), {
    data: buffer.toString("base64"),
    mime,
  });
}

export async function readUploadFromRedis(
  ownerId: string,
  petId: string,
  filename: string
): Promise<{ buffer: Buffer; mime: string } | null> {
  const stored = await getRedis().get<{ data: string; mime: string }>(
    uploadRedisKey(ownerId, petId, filename)
  );
  if (!stored?.data) return null;
  return { buffer: Buffer.from(stored.data, "base64"), mime: stored.mime };
}

export async function saveUploadToFile(
  ownerId: string,
  petId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const dir = path.join(getUploadDir(), ownerId, petId);
  await fs.mkdir(dir, { recursive: true });
  const absolutePath = path.join(dir, filename);
  await fs.writeFile(absolutePath, buffer);
  return absolutePath;
}

export async function readUploadFromFile(
  ownerId: string,
  petId: string,
  filename: string
): Promise<{ buffer: Buffer; mime: string } | null> {
  const filePath = path.join(getUploadDir(), ownerId, petId, filename);
  try {
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filename).slice(1).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "image/jpeg";
    return { buffer, mime };
  } catch {
    return null;
  }
}

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function getMediaUrl(ownerId: string, petId: string, filename: string): string {
  if (useRedisStorage() || isVercel()) {
    return `/api/media/${ownerId}/${petId}/${filename}`;
  }
  return `/uploads/${ownerId}/${petId}/${filename}`;
}

export async function resolveUploadBuffer(imageUrl: string): Promise<Buffer | null> {
  if (imageUrl.startsWith("/api/media/")) {
    const parts = imageUrl.replace("/api/media/", "").split("/");
    const parsed = parseMediaPath(parts);
    if (!parsed) return null;

    if (useRedisStorage()) {
      const file = await readUploadFromRedis(
        parsed.ownerId,
        parsed.petId,
        parsed.filename
      );
      return file?.buffer ?? null;
    }
    const file = await readUploadFromFile(
      parsed.ownerId,
      parsed.petId,
      parsed.filename
    );
    return file?.buffer ?? null;
  }

  if (imageUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", imageUrl);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  return null;
}

export function extToMime(ext: string): string {
  return MIME_BY_EXT[ext] ?? "image/jpeg";
}

export async function createUploadFilename(ext: string): Promise<string> {
  return `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
}
