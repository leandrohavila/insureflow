"use client";

import { useState } from "react";

import { submitPropertyLead } from "@/services/catalog";
import type { CatalogSource, CreatePropertyLeadInput, PropertyLead } from "@/types/property";

export function useSubmitLead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PropertyLead | null>(null);
  const [source, setSource] = useState<CatalogSource | null>(null);

  async function submit(input: CreatePropertyLeadInput) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await submitPropertyLead(input);
      setResult(response.data);
      setSource(response.source);
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Não foi possível enviar o interesse";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { submit, loading, error, result, source };
}
