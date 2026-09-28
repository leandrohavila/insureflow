import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Home, KeyRound, Landmark, MessageCircle, Store, Trees } from "lucide-react";

import { HeroFeaturedCard } from "@/components/hero-featured-card";
import { HeroSearch } from "@/components/hero-search";
import { InstitutionalStats } from "@/components/institutional-stats";
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
  const title = config?.heroTitle?.trim() || "Encontre o imóvel ideal para morar ou investir em Uberaba";
  const subtitle =
    config?.heroSubtitle?.trim() ||
    "Casas, apartamentos, terrenos e imóveis comerciais com atendimento especializado e as melhores oportunidades da região.";
  const name = companyName(config);
  const contactHref = brokerHref(config, name);
  const contactLabel = config?.whatsapp ? "WhatsApp" : "Falar com um corretor";
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
      <section className="relative bg-[#000C24] text-white lg:min-h-[780px]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 75% 35%, #10294B 0%, rgba(16,41,75,.55) 45%, #000C24 80%)",
            }}
          />
          <div className="absolute left-[-10%] top-[18%] aspect-square w-[80vw] max-w-[44rem] rounded-full bg-[rgba(222,174,93,0.15)] blur-[120px]" />
        </div>
        <SiteHeader config={config} overlay />
        <div className="relative mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-4 pb-10 pt-24 md:px-8 md:pt-28 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-x-16 lg:gap-y-14 lg:pb-0 lg:pt-36 2xl:max-w-[110rem]">
          <div className="hero-fade-up max-w-[720px]">
            {creci && (
              <p className="mb-5 inline-flex w-fit rounded-full border border-[#DEAE5D]/40 bg-[#DEAE5D]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#DEAE5D]">
                CRECI {creci}
              </p>
            )}
            <h1 className="text-[clamp(2.25rem,6vw,4.25rem)] font-extrabold leading-[1.05] tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-5 max-w-[36rem] text-base leading-relaxed text-white/80 md:mt-6 md:text-lg">{subtitle}</p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/comprar"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] shadow-[0_12px_30px_-10px_rgba(222,174,93,.6)] transition-colors hover:bg-[#DEAE5D] sm:flex-none"
              >
                <Home className="size-4" aria-hidden />
                Comprar
              </Link>
              <Link
                href="/alugar"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:border-[#DEAE5D] hover:text-[#DEAE5D] sm:flex-none"
              >
                <KeyRound className="size-4" aria-hidden />
                Alugar
              </Link>
              {contactHref && (
                <a
                  href={contactHref}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:border-[#DEAE5D] hover:text-[#DEAE5D] sm:w-auto"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  {contactLabel}
                </a>
              )}
            </div>
          </div>
          <div className="hero-fade-up hero-fade-up-delay-2 order-last mx-auto w-full max-w-md lg:order-none lg:mx-0 lg:max-w-[30rem] lg:justify-self-end">
            <HeroFeaturedCard property={featured[0] ?? null} />
          </div>
          <div className="hero-fade-up hero-fade-up-delay-1 relative z-10 lg:col-span-2 lg:-mb-16">
            <HeroSearch facets={facets.data} />
          </div>
        </div>
      </section>

      <InstitutionalStats />

      <section
        id="imoveis-destaque"
        className="scroll-mt-16 mx-auto w-full max-w-[90rem] px-4 py-8 md:px-8 md:py-14 2xl:max-w-[110rem]"
      >
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">Imóveis em destaque</h2>
          <Link
            href="/imoveis"
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-[#8a6a2f]"
          >
            Ver todos
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="mx-auto mt-4 max-w-xl rounded-2xl bg-white px-6 py-8 text-center shadow-[0_10px_30px_rgba(0,12,36,.06)] md:mt-8">
            <p className="text-3xl" aria-hidden>
              🏠
            </p>
            <p className="mt-4 text-lg font-semibold text-[#000C24]">Novos imóveis serão publicados em breve.</p>
            <p className="mt-2 text-sm text-[#10294B]">Cadastre-se para receber oportunidades exclusivas.</p>
            {contactHref && (
              <a
                href={contactHref}
                className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
              >
                Falar com um corretor
              </a>
            )}
          </div>
        ) : (
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-6 sm:mt-8 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((property, index) => (
              <PropertyCard key={property.id} property={property} priority={index < 2} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-[90rem] px-4 py-6 md:px-8 md:py-14 2xl:max-w-[110rem]">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Busque por categoria</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
          {CATEGORY_LINKS.map((category) => (
            <Link
              key={category.slug}
              href={`/imoveis/tipos/${category.slug}`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-[#10294B] px-4 text-sm font-semibold text-white"
            >
              {category.label}
            </Link>
          ))}
        </div>
        <div className="mt-8 hidden gap-4 sm:grid-cols-2 md:grid xl:grid-cols-5">
          {CATEGORY_LINKS.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug];
            return (
              <Link
                key={category.slug}
                href={`/imoveis/tipos/${category.slug}`}
                className="flex min-h-36 flex-col justify-between rounded-2xl bg-[#10294B] p-5 text-lg font-semibold text-white hover:bg-[#C09048] hover:text-[#000C24]"
              >
                <Icon className="size-7" aria-hidden />
                {category.label}
              </Link>
            );
          })}
        </div>
      </section>

      {launchItems.length > 0 && (
        <section id="lancamentos" className="scroll-mt-16 bg-[#F8F9FA] py-8 md:py-14">
          <div className="mx-auto w-full max-w-[90rem] space-y-4 px-4 md:space-y-6 md:px-8 2xl:max-w-[110rem]">
            <h2 className="text-xl font-semibold tracking-tight md:text-3xl">Lançamentos</h2>
            {launchItems.map((property) => (
              <LaunchCard key={property.id} property={property} />
            ))}
          </div>
        </section>
      )}

      <section className="cv-auto bg-white py-8 md:py-14">
        <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Imóveis por bairro</h2>
          {facets.data.neighborhoods.length === 0 ? (
            <p className="mt-4 text-sm text-[#10294B]">Os bairros aparecem aqui conforme os imóveis publicados.</p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {facets.data.neighborhoods.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/imoveis/bairros/${item.slug}`}
                    className="block min-h-11 rounded-xl border border-[#E6E8EC] px-4 py-3 hover:border-[#C09048]"
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

      <section id="sobre" className="cv-auto scroll-mt-16 bg-[#F8F8F8]">
        <div className="mx-auto grid w-full max-w-[90rem] items-center gap-6 px-4 py-8 md:gap-10 md:px-8 md:py-16 lg:grid-cols-2 2xl:max-w-[110rem]">
          {aboutImage && (
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-[#10294B]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aboutImage}
                alt=""
                width={960}
                height={720}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#000C24] md:text-4xl">{aboutTitle}</h2>
            {aboutLead && aboutLead !== aboutTitle && (
              <p className="mt-3 text-lg font-medium text-[#8a6a2f]">{aboutLead}</p>
            )}
            <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-[#10294B]">{aboutText}</p>
            <a
              href="#contato"
              className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
            >
              Conheça nossa história
            </a>
          </div>
        </div>
      </section>

      <section className="cv-auto bg-white py-8 md:py-16">
        <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-center text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">
            Nossos Diferenciais
          </h2>
          <ul className="mt-6 grid gap-3 md:mt-8 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
            {differentials.map((item) => (
              <li
                key={item}
                className="rounded-2xl border-t-4 border-[#C09048] bg-white p-5 shadow-[0_10px_30px_rgba(0,12,36,.06)] md:p-6"
              >
                <p className="text-base font-semibold text-[#000C24] md:text-lg">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contato" className="scroll-mt-16 text-white" style={{ background: "linear-gradient(135deg, #000C24, #10294B)" }}>
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-12 text-center md:py-20">
          <h2 className="text-2xl font-bold md:text-4xl">Não encontrou o imóvel ideal?</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/90 md:mt-4 md:text-base">
            Nossa equipe pode encontrar oportunidades exclusivas para você.
          </p>
          {contactHref && (
            <a
              href={contactHref}
              className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D] md:mt-8"
            >
              Solicitar atendimento
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
