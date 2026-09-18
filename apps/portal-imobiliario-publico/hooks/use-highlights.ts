"use client";

import { useEffect, useState } from "react";

import { listHighlights } from "@/services/catalog";
import type { CatalogSource, PublicProperty } from "@/types/property";

export function useHighlights() {
  const [data, setData] = useState<PublicProperty[]>([]);
  const [source, setSource] = useState<CatalogSource>("api");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listHighlights({ limit: 6 })
      .then((result) => {
        if (cancelled) return;
        setData(result.data.data);
        setSource(result.source);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar destaques");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, source, error, loading };
}
