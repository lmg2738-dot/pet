import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
} from "@/lib/validations";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

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
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const dir = path.join(UPLOAD_DIR, ownerId, petId);
  await fs.mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const absolutePath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  const relativePath = `/uploads/${ownerId}/${petId}/${filename}`;
  return { relativePath, absolutePath };
}

export function toPublicImageUrl(relativePath: string, request: Request): string {
  const host = request.headers.get("host") ?? "localhost:50004";
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    request.headers.get("origin") ??
    `http://${host}`;

  return `${base.replace(/\/$/, "")}${relativePath}`;
}
