import { notFound } from "next/navigation";

import { SeoCatalog, seoMetadata } from "@/components/seo-catalog";
import { UBERABA_NEIGHBORHOODS, type UberabaNeighborhoodSlug } from "@/lib/uberaba";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ bairro: string }> };

function neighborhood(slug: string) {
  if (slug in UBERABA_NEIGHBORHOODS) {
    return UBERABA_NEIGHBORHOODS[slug as UberabaNeighborhoodSlug];
  }
  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const { bairro } = await params;
  const name = neighborhood(bairro);
  if (!name) return { title: "Bairro" };
  return seoMetadata(
    `Imóveis no ${name}, Uberaba`,
    `Imóveis no bairro ${name} em Uberaba. Compre ou alugue e fale com a imobiliária.`,
    `/imoveis/uberaba/${bairro}`,
  );
}

export default async function UberabaNeighborhoodPage({ params }: PageProps) {
  const { bairro } = await params;
  const name = neighborhood(bairro);
  if (!name) notFound();
  return (
    <SeoCatalog
      title={`Imóveis no ${name}`}
      description={`Opções no bairro ${name}, em Uberaba.`}
      preset={{ city: "Uberaba", neighborhood: name }}
    />
  );
}
