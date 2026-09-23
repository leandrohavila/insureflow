"use client";

import { useEffect, useState } from "react";

import { searchProperties } from "@/services/catalog";
import type { PropertyListQuery, PropertyListResult } from "@/types/property";

export function useProperties(query: PropertyListQuery) {
  const [data, setData] = useState<PropertyListResult | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    searchProperties(query)
      .then((result) => {
        if (cancelled) return;
        setData(result.data);
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // query is serialized in `key`; attempt repeats the same query
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  return {
    data,
    error,
    loading,
    retry: () => setAttempt((current) => current + 1),
  };
}
