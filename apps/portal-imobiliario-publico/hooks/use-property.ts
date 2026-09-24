"use client";

import { useEffect, useState } from "react";

import { CatalogNotFoundError } from "@/lib/errors";
import { getPropertyBySlug } from "@/services/catalog";
import type { PublicProperty } from "@/types/property";

export function useProperty(slug: string) {
  const [data, setData] = useState<PublicProperty | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setNotFound(false);
    getPropertyBySlug(slug)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(null);
        if (err instanceof CatalogNotFoundError) {
          setNotFound(true);
          return;
        }
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  return {
    data,
    notFound,
    error,
    loading,
    retry: () => setAttempt((current) => current + 1),
  };
}
