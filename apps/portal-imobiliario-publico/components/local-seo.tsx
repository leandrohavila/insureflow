import Link from "next/link";

import { OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { portalOrigin, toAbsoluteUrl } from "@/lib/site";
import { LOCAL_SEO_PATHS, UBERABA_LANDINGS } from "@/lib/uberaba";
import type { PortalConfig } from "@/types/property";

const LINKS = UBERABA_LANDINGS.filter((item) =>
  (LOCAL_SEO_PATHS as readonly string[]).includes(item.path),
);

export function LocalBusinessJsonLd({ config }: { config: PortalConfig | null }) {
  const origin = portalOrigin();
  const sameAs = [config?.instagram, config?.facebook, config?.youtube]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: origin,
    image: toAbsoluteUrl(OG_IMAGE_PATH),
    areaServed: {
      "@type": "City",
      name: "Uberaba",
      containedInPlace: { "@type": "State", name: "Minas Gerais", addressCountry: "BR" },
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: config?.address?.trim() || undefined,
      addressLocality: "Uberaba",
      addressRegion: "MG",
      addressCountry: "BR",
    },
    telephone: config?.phone?.trim() || config?.whatsapp?.trim() || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function LocalSeo() {
  return (
    <section id="uberaba" className="bg-white py-8 md:py-16" aria-labelledby="seo-local-titulo">
      <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
        <h2 id="seo-local-titulo" className="text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">
          Imóveis em Uberaba
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#10294B] md:text-base">
          O Grupo Ávila Imóveis atende compra, venda e aluguel em Uberaba. Veja casas, apartamentos, terrenos e
          imóveis comerciais com atendimento direto.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {LINKS.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className="block min-h-11 rounded-2xl border border-[#E6E8EC] px-5 py-4 hover:border-[#C09048]"
              >
                <span className="font-semibold text-[#000C24]">{item.title}</span>
                <span className="mt-1 block text-sm text-[#10294B]">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
