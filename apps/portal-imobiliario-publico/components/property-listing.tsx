"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { parseListQuery, PropertyFilters } from "@/components/property-filters";
import { PropertyCard } from "@/components/property-card";
import { SourceBanner } from "@/components/source-banner";
import { useProperties } from "@/hooks/use-properties";

function withPage(searchParams: URLSearchParams, page: number) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  return params.toString();
}

export function PropertyListing() {
  const searchParams = useSearchParams();
  const query = parseListQuery(Object.fromEntries(searchParams.entries()));
  const { data, source, error, loading } = useProperties(query);
  const total = data?.total ?? 0;
  const page = data?.page ?? 1;
  const limit = data?.limit ?? 12;
  const hasNext = page * limit < total;

  return (
    <div className="space-y-4">
      <SourceBanner source={source} />
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Imóveis</h1>
          <p className="text-sm text-[#10294B]">
            {loading ? "Carregando imóveis..." : data ? `${total} ${total === 1 ? "imóvel" : "imóveis"}` : "Catálogo publicado"}
          </p>
        </div>
      </div>
      <PropertyFilters query={query} />
      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && data && data.data.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum imóvel publicado com esses filtros.</p>
      )}
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
        {data?.data.map((property, index) => (
          <PropertyCard key={property.id} property={property} priority={index < 2} />
        ))}
      </div>
      {data && total > limit && (
        <div className="flex items-center justify-between gap-2 text-sm">
          {page > 1 ? (
            <Link href={`/imoveis?${withPage(searchParams, page - 1)}`} className="inline-flex min-h-11 items-center px-2 font-semibold">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[#10294B]">
            Página {page} · {total} imóveis
          </span>
          {hasNext ? (
            <Link href={`/imoveis?${withPage(searchParams, page + 1)}`} className="inline-flex min-h-11 items-center px-2 font-semibold">
              Próxima
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
