"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { InterestForm } from "@/components/interest-form";
import { SourceBanner } from "@/components/source-banner";
import { useProperty } from "@/hooks/use-property";

export default function InterestPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { data, source, error, loading } = useProperty(slug);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-red-700">{error ?? "Imóvel não encontrado"}</p>;
  }

  return (
    <div className="space-y-4">
      <SourceBanner source={source} />
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
