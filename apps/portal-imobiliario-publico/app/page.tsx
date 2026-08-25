"use client";

import Link from "next/link";

import { PropertyCard } from "@/components/property-card";
import { SourceBanner } from "@/components/source-banner";
import { buttonVariants } from "@/components/ui/button";
import { useHighlights } from "@/hooks/use-highlights";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const { data, source, error, loading } = useHighlights();

  return (
    <div className="space-y-6">
      <SourceBanner source={source} />
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
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!loading && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum destaque publicado. Cadastre e publique um imóvel no CRM para validar.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </div>
  );
}
