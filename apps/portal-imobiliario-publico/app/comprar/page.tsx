import { SeoCatalog, seoMetadata } from "@/components/seo-catalog";

export const dynamic = "force-dynamic";

const title = "Comprar imóveis";
const description = "Imóveis à venda. Filtre por tipo, bairro, cidade ou código e fale com a imobiliária.";

export const metadata = seoMetadata(title, description, "/comprar");

export default function ComprarPage() {
  return <SeoCatalog title={title} description={description} preset={{ purposeMode: "buy" }} />;
}
