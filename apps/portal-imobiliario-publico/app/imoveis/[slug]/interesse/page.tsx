"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { CatalogLoadError } from "@/components/catalog-load-error";
import { InterestForm } from "@/components/interest-form";
import { useProperty } from "@/hooks/use-property";

export default function InterestPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data, notFound, error, loading, retry } = useProperty(slug);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (error) {
    return <CatalogLoadError onRetry={retry} />;
  }
  if (notFound || !data) {
    return <p className="text-sm text-muted-foreground">Imóvel não encontrado</p>;
  }

  return (
    <div className="space-y-4">
      <Link href={`/imoveis/${data.slug}`} className="text-sm text-muted-foreground">
        ← Voltar ao imóvel
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tenho interesse</h1>
        <p className="text-sm text-muted-foreground">{data.title}</p>
      </div>
      <InterestForm propertyId={data.id} propertySlug={data.slug} />
    </div>
  );
}
