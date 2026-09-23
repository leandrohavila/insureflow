"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { CatalogLoadError } from "@/components/catalog-load-error";
import { parseListQuery, PropertyFilters } from "@/components/property-filters";
import { PropertyCard } from "@/components/property-card";
import { useProperties } from "@/hooks/use-properties";

function ListingBody() {
  const searchParams = useSearchParams();
  const query = parseListQuery(Object.fromEntries(searchParams.entries()));
  const { data, error, loading, retry } = useProperties(query);
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 12;
  const hasNext = page * limit < total;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Imóveis</h1>
        <p className="text-sm text-muted-foreground">
          Filtros: cidade, bairro, finalidade e faixa de preço.
        </p>
      </div>
      <PropertyFilters query={query} />
      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {!loading && error && <CatalogLoadError onRetry={retry} />}
      {!loading && !error && data && data.data.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum imóvel publicado com esses filtros.</p>
      )}
      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
      {data && total > limit && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/imoveis?${withPage(searchParams, page - 1)}`}>Anterior</Link>
          ) : (
            <span />
          )}
          <span>
            Página {page} · {total} imóveis
          </span>
          {hasNext ? (
            <Link href={`/imoveis?${withPage(searchParams, page + 1)}`}>Próxima</Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}

function withPage(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  return params.toString();
}

export default function ListingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
      <ListingBody />
    </Suspense>
  );
}
