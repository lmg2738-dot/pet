"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useApi } from "@/hooks/useApi";
import type { Pet } from "@/types/database";

interface PetContextValue {
  pets: Pet[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const PetContext = createContext<PetContextValue | null>(null);

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { fetchApi, ownerId } = useApi();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const data = await fetchApi<{ pets: Pet[] }>("/api/pet");
      setPets(data.pets);
    } catch {
      setPets([]);
    } finally {
      setLoading(false);
    }
  }, [fetchApi, ownerId]);

  useEffect(() => {
    if (ownerId) refresh();
  }, [ownerId, refresh]);

  const value = useMemo(
    () => ({ pets, loading, refresh }),
    [pets, loading, refresh]
  );

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePets() {
  const ctx = useContext(PetContext);
  if (!ctx) {
    throw new Error("usePets must be used within PetProvider");
  }
  return ctx;
}
