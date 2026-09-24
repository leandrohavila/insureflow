import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PropertyCard } from "@/components/property-card";
import { getFacets, listProperties } from "@/services/catalog";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const facets = await getFacets();
  const match = facets.data.neighborhoods.find((item) => item.slug === slug);
  if (!match) return { title: "Bairro" };
  const title = `Imóveis no ${match.name}`;
  const description = `${match.count} imóveis publicados no ${match.name}, ${match.city}.`;
  return {
    title,
    description,
    openGraph: { title, description, locale: "pt_BR", type: "website" },
  };
}

export default async function NeighborhoodPage({ params }: PageProps) {
  const { slug } = await params;
  const facets = await getFacets();
  const match = facets.data.neighborhoods.find((item) => item.slug === slug);
  if (!match) notFound();
  const listing = await listProperties({
    neighborhood: match.name,
    city: match.city,
    limit: 24,
  });

  return (
      <main className="mx-auto w-full max-w-[90rem] px-4 py-8 md:px-8 2xl:max-w-[110rem]">
        <h1 className="text-3xl font-semibold tracking-tight text-navy">Imóveis no {match.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {match.city} · {listing.data.total} publicados no CRM
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {listing.data.data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        {listing.data.data.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">Nenhum imóvel publicado neste bairro.</p>
        )}
        <Link href="/imoveis" className="mt-8 inline-block text-sm text-navy underline decoration-gold underline-offset-4">
          Ver todos os imóveis
        </Link>
      </main>
  );
}
