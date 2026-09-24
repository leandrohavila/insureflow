"use client";

import { useEffect, useState } from "react";

import { listHighlights } from "@/services/catalog";
import type { PublicProperty } from "@/types/property";

export function useHighlights() {
  const [data, setData] = useState<PublicProperty[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    listHighlights({ limit: 6 })
      .then((result) => {
        if (cancelled) return;
        setData(result.data.data);
      })
      .catch(() => {
        if (cancelled) return;
        setData([]);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return {
    data,
    error,
    loading,
    retry: () => setAttempt((current) => current + 1),
  };
}
