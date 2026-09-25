import { SeoCatalog, seoMetadata } from "@/components/seo-catalog";

export const dynamic = "force-dynamic";

const title = "Imóveis em Uberaba";
const description = "Apartamentos, casas e locação em Uberaba. Veja bairros como Centro, Abadia e Fabrício.";

export const metadata = seoMetadata(title, description, "/imoveis/uberaba");

export default function UberabaPage() {
  return <SeoCatalog title={title} description={description} preset={{ city: "Uberaba" }} />;
}
