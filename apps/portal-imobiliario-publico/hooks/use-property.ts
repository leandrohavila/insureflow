"use client";

import { useEffect, useState } from "react";

import { CatalogNotFoundError } from "@/lib/errors";
import { getPropertyBySlug } from "@/services/catalog";
import type { CatalogSource, PublicProperty } from "@/types/property";

export function useProperty(slug: string) {
  const [data, setData] = useState<PublicProperty | null>(null);
  const [source, setSource] = useState<CatalogSource>("api");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPropertyBySlug(slug)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
        setSource(result.source);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof CatalogNotFoundError) {
          setError("Imóvel não encontrado");
          return;
        }
        setError(err instanceof Error ? err.message : "Falha ao carregar imóvel");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { data, source, error, loading };
}
