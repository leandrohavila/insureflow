"use client";

import Link from "next/link";

import { CatalogLoadError } from "@/components/catalog-load-error";
import { PropertyCard } from "@/components/property-card";
import { buttonVariants } from "@/components/ui/button";
import { useHighlights } from "@/hooks/use-highlights";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { data, error, loading, retry } = useHighlights();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Imóveis em Cuiabá</h1>
        <p className="text-sm text-muted-foreground">
          Catálogo público da Ávila Imóveis. Somente imóveis publicados no CRM aparecem aqui.
        </p>
        <Link href="/imoveis" className={cn(buttonVariants(), "inline-flex")}>
          Ver todos os imóveis
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Destaques</h2>
        {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!loading && error && <CatalogLoadError onRetry={retry} />}
        {!loading && !error && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum destaque publicado. Cadastre e publique um imóvel no CRM para validar.
          </p>
        )}
        {!loading && !error && (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
