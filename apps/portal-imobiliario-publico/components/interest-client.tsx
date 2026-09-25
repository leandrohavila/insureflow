"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { InterestForm } from "@/components/interest-form";
import { SourceBanner } from "@/components/source-banner";
import { useProperty } from "@/hooks/use-property";

export function InterestClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const slug = params.slug;
  const intent = searchParams.get("intent") === "visita" ? "visita" : "interesse";
  const { data, source, error, loading } = useProperty(slug);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (error || !data) {
    return <p className="text-sm text-red-700">{error ?? "Imóvel não encontrado"}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8">
      <SourceBanner source={source} />
      <Link href={`/imoveis/${data.slug}`} className="inline-flex min-h-11 items-center text-sm text-muted-foreground">
        ← Voltar ao imóvel
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {intent === "visita" ? "Agendar visita" : "Tenho interesse"}
        </h1>
        <p className="text-sm text-muted-foreground">{data.title}</p>
      </div>
      <InterestForm
        propertyId={data.id}
        propertySlug={data.slug}
        propertyCode={data.publicCode}
        propertyTitle={data.title}
        purpose={data.purpose}
        intent={intent}
      />
    </div>
  );
}
