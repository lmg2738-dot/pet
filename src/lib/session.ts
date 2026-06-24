import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const OWNER_COOKIE = "pawinsight_owner_id";

export async function getOwnerId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(OWNER_COOKIE)?.value;

  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) {
    return existing;
  }

  return randomUUID();
}

export function getOwnerIdFromRequest(request: Request): string {
  const header = request.headers.get("x-owner-id");
  if (header && /^[0-9a-f-]{36}$/i.test(header)) {
    return header;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`${OWNER_COOKIE}=([0-9a-f-]{36})`, "i")
  );
  if (match?.[1]) {
    return match[1];
  }

  return randomUUID();
}
