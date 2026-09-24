import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PropertyCard } from "@/components/property-card";
import { SiteHeader } from "@/components/site-header";
import { categoryBySlug } from "@/lib/commercial";
import { getPortalHome, listProperties } from "@/services/catalog";
import type { PropertyType } from "@/types/property";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) return { title: "Categoria" };
  const title = category.label;
  const description = `${category.label} publicados no portal.`;
  return {
    title,
    description,
    openGraph: { title, description, locale: "pt_BR", type: "website" },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = categoryBySlug(slug);
  if (!category) notFound();
  const [portal, listing] = await Promise.all([
    getPortalHome(),
    listProperties({ type: category.type as PropertyType, limit: 24 }),
  ]);

  return (
    <>
      <SiteHeader config={portal.data.config} />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-8 md:px-8 2xl:max-w-[110rem]">
        <h1 className="text-3xl font-semibold tracking-tight">{category.label}</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {listing.data.data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
        {listing.data.data.length === 0 && (
          <p className="mt-6 text-sm text-stone-500">Nenhum imóvel publicado nesta categoria.</p>
        )}
        <Link href="/imoveis" className="mt-8 inline-block text-sm underline">
          Ver todos os imóveis
        </Link>
      </main>
    </>
  );
}
