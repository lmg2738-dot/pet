import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/lib/validations";
import { assertStorageReady, isVercel, useRedisStorage } from "@/lib/db/config";
import {
  createUploadFilename,
  extToMime,
  getMediaUrl,
  saveUploadToFile,
  saveUploadToRedis,
} from "@/lib/storage/media";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "허용되지 않는 MIME 타입입니다. JPEG, PNG, WebP, GIF만 가능합니다.";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "파일 크기가 10MB를 초과했습니다.";
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return "허용되지 않는 파일 형식입니다.";
  }
  return null;
}

export async function savePetImage(
  ownerId: string,
  petId: string,
  file: File
): Promise<{ relativePath: string; absolutePath: string }> {
  assertStorageReady();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = await createUploadFilename(ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = extToMime(ext);

  if (useRedisStorage() || isVercel()) {
    await saveUploadToRedis(ownerId, petId, filename, buffer, mime);
    const relativePath = getMediaUrl(ownerId, petId, filename);
    return { relativePath, absolutePath: relativePath };
  }

  const absolutePath = await saveUploadToFile(ownerId, petId, filename, buffer);
  const relativePath = getMediaUrl(ownerId, petId, filename);
  return { relativePath, absolutePath };
}

export function toPublicImageUrl(relativePath: string, request: Request): string {
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }

  const host = request.headers.get("host") ?? "localhost:50004";
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    `http://${host}`;

  return `${base.replace(/\/$/, "")}${relativePath}`;
}
