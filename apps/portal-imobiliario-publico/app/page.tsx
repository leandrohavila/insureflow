import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Home, Landmark, Store, Trees } from "lucide-react";

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

const CATEGORY_ICONS = {
  casas: Home,
  apartamentos: Building2,
  terrenos: Trees,
  condominios: Landmark,
  comerciais: Store,
} as const;

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
  const contactHref = brokerHref(config, name);
  const aboutTitle = `Sobre a ${name}`;
  const aboutLead = config?.aboutTitle?.trim() || null;
  const creci = config?.creci?.trim() || null;
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
        className="relative flex min-h-[70vh] bg-[#000C24] bg-cover bg-center text-white md:min-h-[85vh]"
        style={heroImage ? { backgroundImage: `url("${heroImage}")` } : undefined}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,12,36,.92) 0%, rgba(0,12,36,.75) 40%, rgba(0,12,36,.45) 100%)",
          }}
        />
        <SiteHeader config={config} overlay />
        <div className="relative mx-auto flex w-full max-w-[90rem] flex-col justify-center px-4 pb-24 pt-28 text-left md:px-8 md:pb-32 2xl:max-w-[110rem]">
          {creci && (
            <p className="mb-4 inline-flex w-fit rounded-full bg-[#C09048] px-3 py-1 text-xs font-semibold tracking-wide text-[#000C24]">
              CRECI {creci}
            </p>
          )}
          <h1 className="max-w-4xl font-bold leading-[1.05] tracking-tight [font-size:clamp(40px,5vw,72px)]">
            {title}
          </h1>
          {subtitle && <p className="mt-5 max-w-2xl text-base text-white/85 md:text-lg">{subtitle}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/imoveis"
              className="inline-flex h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] transition-all duration-300 hover:bg-[#DEAE5D]"
            >
              Ver Imóveis
            </Link>
            {contactHref && (
              <a
                href={contactHref}
                className="inline-flex h-12 items-center rounded-xl border border-white px-6 text-sm font-semibold text-white transition-all duration-300 hover:border-[#DEAE5D] hover:text-[#DEAE5D]"
              >
                Falar com um Corretor
              </a>
            )}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[90rem] translate-y-1/2 px-4 md:px-8 2xl:max-w-[110rem]">
          <HeroSearch facets={facets.data} />
        </div>
      </section>

      <section id="sobre" className="bg-[#F8F8F8]">
        <div className="mx-auto grid w-full max-w-[90rem] items-center gap-10 px-4 pb-16 pt-36 md:px-8 lg:grid-cols-2 2xl:max-w-[110rem]">
          {aboutImage && (
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#10294B]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={aboutImage} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          )}
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#000C24] md:text-4xl">{aboutTitle}</h2>
            {aboutLead && aboutLead !== aboutTitle && (
              <p className="mt-3 text-lg font-medium text-[#C09048]">{aboutLead}</p>
            )}
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[#10294B]">{aboutText}</p>
            <a
              href="#contato"
              className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] transition-all duration-300 hover:bg-[#DEAE5D]"
            >
              Conheça nossa história
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-center text-3xl font-bold tracking-tight text-[#000C24]">Nossos Diferenciais</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {differentials.map((item) => (
              <li
                key={item}
                className="rounded-2xl border-t-4 border-[#C09048] bg-white p-6 shadow-[0_10px_30px_rgba(0,12,36,.06)] transition-all duration-300 hover:-translate-y-1.5"
              >
                <p className="text-lg font-semibold text-[#000C24]">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 py-16 md:px-8 2xl:max-w-[110rem]">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[#000C24]">Imóveis em Destaque</h2>
        {featured.length === 0 ? (
          <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white px-6 py-10 text-center shadow-[0_10px_30px_rgba(0,12,36,.06)]">
            <p className="text-3xl" aria-hidden>
              🏠
            </p>
            <p className="mt-4 text-lg font-semibold text-[#000C24]">Novos imóveis serão publicados em breve.</p>
            <p className="mt-2 text-sm text-[#10294B]">Cadastre-se para receber oportunidades exclusivas.</p>
            {contactHref && (
              <a
                href={contactHref}
                className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] transition-all duration-300 hover:bg-[#DEAE5D]"
              >
                Falar com um corretor
              </a>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {CATEGORY_LINKS.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug];
            return (
              <Link
                key={category.slug}
                href={`/imoveis/tipos/${category.slug}`}
                className="flex min-h-36 flex-col justify-between rounded-2xl bg-[#10294B] p-5 text-lg font-semibold text-white transition-all duration-300 hover:-translate-y-1.5 hover:bg-[#C09048] hover:text-[#000C24]"
              >
                <Icon className="size-7" aria-hidden />
                {category.label}
              </Link>
            );
          })}
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

      <section
        id="contato"
        className="text-white"
        style={{ background: "linear-gradient(135deg, #000C24, #10294B)" }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Não encontrou o imóvel ideal?</h2>
          <p className="mt-4 text-base text-white/80">
            Nossa equipe pode encontrar oportunidades exclusivas para você.
          </p>
          {contactHref && (
            <a
              href={contactHref}
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] transition-all duration-300 hover:bg-[#DEAE5D]"
            >
              Solicitar Atendimento
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
