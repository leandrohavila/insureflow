import { SeoCatalog, seoMetadata } from "@/components/seo-catalog";
import { uberabaLanding } from "@/lib/uberaba";

export const dynamic = "force-dynamic";

const landing = uberabaLanding("/alugar-apartamento-uberaba");

export const metadata = seoMetadata(landing.title, landing.description, landing.path);

export default function Page() {
  return (
    <SeoCatalog
      title={landing.title}
      description={landing.description}
      preset={{ city: "Uberaba", purposeMode: landing.purposeMode, type: landing.type }}
    />
  );
}
