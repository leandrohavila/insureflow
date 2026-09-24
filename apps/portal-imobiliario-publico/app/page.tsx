import type { Metadata } from "next";
import Link from "next/link";

import { GrupoAvilaLogo } from "@/components/grupo-avila-logo";
import { HeroSearch } from "@/components/hero-search";
import { LaunchCard } from "@/components/launch-card";
import { PropertyCard } from "@/components/property-card";
import { SiteHeader } from "@/components/site-header";
import { SourceBanner } from "@/components/source-banner";
import { CATEGORY_LINKS, companyName, whatsappHref } from "@/lib/commercial";
import { getFacets, getPortalHome, listHighlights, listLaunches } from "@/services/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortalHome();
  const name = companyName(portal.data.config);
  const title = portal.data.config?.heroTitle?.trim() || name;
  const description = portal.data.config?.heroSubtitle?.trim() || `Imóveis publicados por ${name}.`;
  const image = portal.data.config?.heroImage || portal.data.banners[0]?.image;
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

export default async function HomePage() {
  const [portal, highlights, launches, facets] = await Promise.all([
    getPortalHome(),
    listHighlights({ limit: 8 }),
    listLaunches({ limit: 4 }),
    getFacets(),
  ]);
  const config = portal.data.config;
  const banner = portal.data.banners[0];
  const heroImage = banner?.image || config?.heroImage || null;
  const title = banner?.title || config?.heroTitle || null;
  const subtitle = banner?.subtitle || config?.heroSubtitle || null;
  const name = companyName(config);
  const whatsapp = config?.whatsapp
    ? whatsappHref(config.whatsapp, `Olá, quero falar com a ${name}.`)
    : null;
  const source = highlights.source;

  return (
    <div>
      <SourceBanner source={source} />
      <section className="relative min-h-[34rem] bg-navy-deep text-white md:min-h-[40rem]">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        )}
        <div className="avila-hero-overlay absolute inset-0" />
        <SiteHeader config={config} overlay />
        <div className="relative mx-auto flex min-h-[34rem] w-full max-w-[90rem] flex-col justify-end px-4 pb-28 pt-28 md:min-h-[40rem] md:px-8 md:pb-36 2xl:max-w-[110rem]">
          <GrupoAvilaLogo imageClassName="h-16 md:h-20" />
          {title && (
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
          )}
          {subtitle && <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">{subtitle}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-bright"
              >
                WhatsApp
              </a>
            ) : (
              <Link
                href="/imoveis"
                className="inline-flex h-11 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-bright"
              >
                Ver Imóveis
              </Link>
            )}
            {whatsapp && (
              <Link
                href="/imoveis"
                className="inline-flex h-11 items-center rounded-lg border border-white/70 px-5 text-sm font-semibold text-white transition-colors hover:border-gold-bright hover:text-gold-bright"
              >
                Ver Imóveis
              </Link>
            )}
          </div>
        </div>
        <div className="relative z-10 mx-auto -mb-16 w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <HeroSearch facets={facets.data} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 pb-8 pt-24 md:px-8 2xl:max-w-[110rem]">
        <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Imóveis em Destaque</h2>
        <div className="mt-3 h-1 w-16 rounded-full bg-gold" />
        {highlights.data.data.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhum imóvel em destaque publicado no CRM.</p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {highlights.data.data.map((property) => (
              <PropertyCard key={property.id} property={property} featured />
            ))}
          </div>
        )}
      </section>

      <section id="lancamentos" className="bg-background py-16">
        <div className="mx-auto w-full max-w-[90rem] space-y-6 px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">Lançamentos</h2>
          <div className="h-1 w-16 rounded-full bg-gold" />
          {launches.data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento publicado no CRM.</p>
          ) : (
            launches.data.data.map((property) => <LaunchCard key={property.id} property={property} />)
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 py-14 md:px-8 2xl:max-w-[110rem]">
        <h2 className="text-2xl font-semibold tracking-tight text-navy">Busque por categoria</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {CATEGORY_LINKS.map((category) => (
            <Link
              key={category.slug}
              href={`/imoveis/tipos/${category.slug}`}
              className="flex min-h-28 items-end rounded-2xl border-b-4 border-gold bg-navy p-4 text-lg font-semibold text-white transition-colors hover:bg-navy-deep"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-card py-14">
        <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-semibold tracking-tight text-navy">Imóveis por bairro</h2>
          {facets.data.neighborhoods.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Os bairros aparecem aqui conforme os imóveis publicados.</p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {facets.data.neighborhoods.map((item) => (
                <li key={item.slug}>
                  <Link href={`/imoveis/bairros/${item.slug}`} className="block rounded-xl border border-border px-4 py-3 transition-colors hover:border-gold">
                    <span className="font-medium text-navy">Imóveis no {item.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {item.city} · {item.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {config?.aboutText && (
        <section id="sobre" className="mx-auto grid w-full max-w-[90rem] gap-8 px-4 py-14 md:px-8 lg:grid-cols-2 2xl:max-w-[110rem]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">
              {config.aboutTitle || `Sobre a ${name}`}
            </h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-navy/80">{config.aboutText}</p>
            {config.differentials.length > 0 && (
              <ul className="mt-6 space-y-2 text-sm">
                {config.differentials.map((item) => (
                  <li key={item} className="rounded-lg border border-border bg-card px-3 py-2 text-navy">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {config.aboutImage && (
            <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.aboutImage} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
        </section>
      )}

      <section id="contato" className="bg-navy text-white">
        <div className="mx-auto flex w-full max-w-[90rem] flex-col items-start justify-between gap-4 px-4 py-12 md:flex-row md:items-center md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-semibold md:text-3xl">Não encontrou o imóvel ideal?</h2>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center rounded-lg bg-gold px-6 text-sm font-semibold text-navy-deep transition-colors hover:bg-gold-bright"
            >
              Falar com um corretor
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
