"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function CatalogLoadError({ onRetry }: { onRetry?: () => void }) {
  const router = useRouter();

  return (
    <div role="alert" className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm">Não foi possível carregar os imóveis neste momento.</p>
      <Button type="button" onClick={() => (onRetry ? onRetry() : router.refresh())}>
        Tentar novamente
      </Button>
    </div>
  );
}
