"use client";

import { useCallback, useState } from "react";

const OWNER_KEY = "pawinsight_owner_id";

function getOrCreateOwnerId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(OWNER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(OWNER_KEY, id);
  }
  return id;
}

export function useOwnerId(): string {
  const [ownerId] = useState(getOrCreateOwnerId);
  return ownerId;
}

export function useApi() {
  const ownerId = useOwnerId();

  const fetchApi = useCallback(
    async <T>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers);
      const id = ownerId || getOrCreateOwnerId();
      headers.set("x-owner-id", id);

      const res = await fetch(url, { ...options, headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed");
      }

      return data as T;
    },
    [ownerId]
  );

  return { fetchApi, ownerId };
}
