import { toAbsoluteUrl } from "@/lib/site";
import { resolveCover } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function RealEstateListingJsonLd({ property }: { property: PublicProperty }) {
  const cover = resolveCover(property);
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description ?? property.title,
    url: toAbsoluteUrl(`/imoveis/${property.slug}`),
    image: cover ? [toAbsoluteUrl(cover.url)] : undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address ?? undefined,
      addressLocality: property.city,
      addressRegion: property.state ?? undefined,
      postalCode: property.postalCode ?? undefined,
      addressCountry: "BR",
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "BRL",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
