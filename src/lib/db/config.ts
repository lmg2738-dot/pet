import path from "path";

export function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

export function getRedisEnv(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.KV_REST_API_URL ??
    "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.KV_REST_API_TOKEN ??
    "";

  if (url && token) return { url, token };
  return null;
}

export function useRedisStorage(): boolean {
  return getRedisEnv() !== null;
}

export function getDbDir(): string {
  if (isVercel()) {
    return path.join("/tmp", "pawinsight", "db");
  }
  return path.join(process.cwd(), "data", "db");
}

export function getUploadDir(): string {
  if (isVercel()) {
    return path.join("/tmp", "pawinsight", "uploads");
  }
  return path.join(process.cwd(), "public", "uploads");
}

export function storageMode(): "redis" | "file" {
  return useRedisStorage() ? "redis" : "file";
}

export function assertStorageReady(): void {
  if (isVercel() && !useRedisStorage()) {
    throw new Error(
      "Vercel 배포 환경에서는 데이터 저장을 위해 Upstash Redis가 필요합니다. " +
        "Vercel 대시보드 → Storage → Upstash Redis 연동 후 " +
        "UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN 환경변수를 설정하세요."
    );
  }
}
