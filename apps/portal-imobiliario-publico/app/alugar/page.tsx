import { SeoCatalog, seoMetadata } from "@/components/seo-catalog";

export const dynamic = "force-dynamic";

const title = "Alugar imóveis";
const description = "Imóveis para locação. Filtre por tipo, bairro, cidade ou código e envie seu interesse.";

export const metadata = seoMetadata(title, description, "/alugar");

export default function AlugarPage() {
  return <SeoCatalog title={title} description={description} preset={{ purposeMode: "rent" }} />;
}
