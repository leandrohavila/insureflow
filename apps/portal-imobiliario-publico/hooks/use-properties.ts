"use client";

import { useEffect, useState } from "react";

import { searchProperties } from "@/services/catalog";
import type {
  CatalogSource,
  PropertyListQuery,
  PropertyListResult,
} from "@/types/property";

export function useProperties(query: PropertyListQuery) {
  const [data, setData] = useState<PropertyListResult | null>(null);
  const [source, setSource] = useState<CatalogSource>("api");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    searchProperties(query)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setSource(result.source);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar imóveis");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // query is serialized in `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, source, error, loading };
}
