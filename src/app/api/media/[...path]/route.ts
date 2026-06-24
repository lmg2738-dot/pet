import { NextRequest } from "next/server";
import {
  parseMediaPath,
  readUploadFromFile,
  readUploadFromRedis,
} from "@/lib/storage/media";
import { useRedisStorage } from "@/lib/db/config";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const parsed = parseMediaPath(pathSegments);

  if (!parsed) {
    return new Response("Not found", { status: 404 });
  }

  const file = useRedisStorage()
    ? await readUploadFromRedis(parsed.ownerId, parsed.petId, parsed.filename)
    : await readUploadFromFile(parsed.ownerId, parsed.petId, parsed.filename);

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
