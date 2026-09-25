import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { HeroSearch } from "@/components/hero-search";
import { LaunchCard } from "@/components/launch-card";
import { PropertyCard } from "@/components/property-card";
import { SiteHeader } from "@/components/site-header";
import { SourceBanner } from "@/components/source-banner";
import {
  ABOUT_TEXT_FALLBACK,
  CATEGORY_LINKS,
  companyName,
  portalDifferentials,
  whatsappHref,
} from "@/lib/commercial";
import { getFacets, getPortalHome, listHighlights, listLaunches } from "@/services/catalog";
import type { PortalConfig } from "@/types/property";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortalHome();
  const name = companyName(portal.data.config);
  const title = portal.data.config?.heroTitle?.trim() || name;
  const description = portal.data.config?.heroSubtitle?.trim() || `Imóveis publicados por ${name}.`;
  const image = portal.data.config?.heroImage || undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: "pt_BR",
      type: "website",
      siteName: name,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

function brokerHref(config: PortalConfig | null, name: string) {
  if (config?.whatsapp) {
    return whatsappHref(config.whatsapp, `Olá, quero falar com a ${name}.`);
  }
  const phone = config?.phone?.replace(/\D/g, "");
  if (phone) return `tel:${phone}`;
  if (config?.email?.trim()) return `mailto:${config.email.trim()}`;
  return null;
}

export default async function HomePage() {
  const [portal, highlights, launches, facets] = await Promise.all([
    getPortalHome(),
    listHighlights({ limit: 8 }),
    listLaunches({ limit: 4 }),
    getFacets(),
  ]);
  const config = portal.data.config;
  const heroImage = config?.heroImage?.trim() || null;
  const title = config?.heroTitle?.trim() || companyName(config);
  const subtitle = config?.heroSubtitle?.trim() || null;
  const name = companyName(config);
  const whatsapp = config?.whatsapp
    ? whatsappHref(config.whatsapp, `Olá, quero falar com a ${name}.`)
    : null;
  const contactHref = brokerHref(config, name);
  const aboutTitle = config?.aboutTitle?.trim() || `Sobre a ${name}`;
  const aboutText = config?.aboutText?.trim() || ABOUT_TEXT_FALLBACK;
  const aboutImage = config?.aboutImage?.trim() || null;
  const differentials = portalDifferentials(config);
  const featured = highlights.data.data;
  const launchItems = launches.data.data;
  const source = highlights.source;

  return (
    <div>
      <SourceBanner source={source} />
      <section
        className="relative min-h-[700px] bg-[#000C24] bg-cover bg-center text-white"
        style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
      >
        <div className="absolute inset-0 bg-black/50" />
        <SiteHeader config={config} overlay />
        <div className="relative mx-auto flex min-h-[700px] w-full max-w-[90rem] flex-col justify-center px-4 pb-28 pt-28 text-left md:px-8 2xl:max-w-[110rem]">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-6xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-base text-white/90 md:text-lg">{subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/imoveis"
              className="inline-flex h-11 items-center rounded-lg bg-[#C09048] px-5 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
            >
              Ver Imóveis
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-lg border border-white px-5 text-sm font-semibold text-white hover:border-[#DEAE5D] hover:text-[#DEAE5D]"
              >
                Falar no WhatsApp
              </a>
            )}
          </div>
        </div>
        <div className="relative z-10 mx-auto -mb-16 w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <HeroSearch facets={facets.data} />
        </div>
      </section>

      <section id="sobre" className="bg-[#F8F9FA]">
        <div className="mx-auto grid w-full max-w-[90rem] items-center gap-8 px-4 pb-14 pt-28 md:px-8 lg:grid-cols-2 2xl:max-w-[110rem]">
          {aboutImage && (
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-[#10294B]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={aboutImage} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#000C24] md:text-3xl">{aboutTitle}</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#10294B] md:text-base">{aboutText}</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-semibold tracking-tight text-[#000C24] md:text-3xl">Nossos Diferenciais</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {differentials.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-[#E6E8EC] bg-[#F8F9FA] p-4">
                <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#C09048] text-[#000C24]">
                  <Check className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium text-[#000C24]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 py-14 md:px-8 2xl:max-w-[110rem]">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Imóveis em Destaque</h2>
        {featured.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[#E6E8EC] bg-white p-6">
            <p className="text-sm text-[#10294B] md:text-base">
              Em breve teremos imóveis disponíveis em nosso portfólio.
            </p>
            {contactHref && (
              <a
                href={contactHref}
                className="mt-4 inline-flex h-11 items-center rounded-lg bg-[#C09048] px-5 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
              >
                Falar com um corretor
              </a>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {featured.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </section>

      {launchItems.length > 0 && (
        <section id="lancamentos" className="bg-[#F8F9FA] py-14">
          <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 md:px-8 2xl:max-w-[110rem]">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Lançamentos</h2>
            {launchItems.map((property) => (
              <LaunchCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-[90rem] px-4 py-14 md:px-8 2xl:max-w-[110rem]">
        <h2 className="text-2xl font-semibold tracking-tight">Busque por categoria</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {CATEGORY_LINKS.map((category) => (
            <Link
              key={category.slug}
              href={`/imoveis/tipos/${category.slug}`}
              className="flex min-h-28 items-end rounded-2xl bg-[#10294B] p-4 text-lg font-semibold text-white hover:bg-[#000C24]"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-semibold tracking-tight">Imóveis por bairro</h2>
          {facets.data.neighborhoods.length === 0 ? (
            <p className="mt-4 text-sm text-[#10294B]">Os bairros aparecem aqui conforme os imóveis publicados.</p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {facets.data.neighborhoods.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/imoveis/bairros/${item.slug}`}
                    className="block rounded-xl border border-[#E6E8EC] px-4 py-3 hover:border-[#C09048]"
                  >
                    <span className="font-medium">Imóveis no {item.name}</span>
                    <span className="mt-1 block text-xs text-[#10294B]">
                      {item.city} · {item.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="contato" className="bg-[#10294B] text-white">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col items-start justify-between gap-4 px-4 py-12 md:flex-row md:items-center md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-semibold md:text-3xl">Não encontrou o imóvel ideal?</h2>
          {contactHref && (
            <a
              href={contactHref}
              className="inline-flex h-12 items-center rounded-lg bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
            >
              Falar com um corretor
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
