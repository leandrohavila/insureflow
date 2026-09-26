import { toAbsoluteUrl } from "@/lib/site";
import { resolveCover } from "@/lib/utils";
import type { PublicProperty } from "@/types/property";

export function RealEstateListingJsonLd({ property }: { property: PublicProperty }) {
  const cover = resolveCover(property);
  const url = toAbsoluteUrl(`/imoveis/${property.slug}`);
  const address = {
    "@type": "PostalAddress",
    streetAddress: property.address ?? undefined,
    addressLocality: property.city,
    addressRegion: property.state ?? undefined,
    postalCode: property.postalCode ?? undefined,
    addressCountry: "BR",
  };
  const placeName = [property.neighborhood, property.city].filter(Boolean).join(", ");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description ?? property.title,
        url,
        image: cover ? [toAbsoluteUrl(cover.url)] : undefined,
        address,
        about: { "@id": `${url}#residence` },
        offers: {
          "@type": "Offer",
          price: property.price,
          priceCurrency: "BRL",
          url,
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "Residence",
        "@id": `${url}#residence`,
        name: property.title,
        address,
        numberOfRooms: property.bedrooms ?? undefined,
        floorSize: property.areaM2
          ? { "@type": "QuantitativeValue", value: property.areaM2, unitCode: "MTK" }
          : undefined,
      },
      {
        "@type": "Place",
        name: placeName || property.city,
        address,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
