import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Home, Landmark, MessageCircle, Rocket, Store, Trees } from "lucide-react";

import { CategoryCard, type CategoryTone } from "@/components/category-card";
import { HeroFeaturedCard } from "@/components/hero-featured-card";
import { HeroSearch } from "@/components/hero-search";
import { InstitutionalStats } from "@/components/institutional-stats";
import { LaunchCard } from "@/components/launch-card";
import { LocalBusinessJsonLd, LocalSeo } from "@/components/local-seo";
import { PropertyCard } from "@/components/property-card";
import { SiteHeader } from "@/components/site-header";
import { SocialProof } from "@/components/social-proof";
import { SourceBanner } from "@/components/source-banner";
import { TrackedAnchor } from "@/components/tracked-link";
import { WhatsAppHighlight } from "@/components/whatsapp-highlight";
import {
  ABOUT_TEXT_FALLBACK,
  CATEGORY_LINKS,
  aboutSectionTitle,
  attendanceWhatsappHref,
  companyName,
  portalDifferentials,
} from "@/lib/commercial";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo";
import { getFacets, getPortalHome, listHighlights, listLaunches, listProperties } from "@/services/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: SITE_TITLE },
    description: SITE_DESCRIPTION,
    alternates: { canonical: "/" },
  };
}

const CATEGORY_ICONS = {
  casas: Home,
  apartamentos: Building2,
  terrenos: Trees,
  condominios: Landmark,
  comerciais: Store,
  lancamentos: Rocket,
} as const;

const HOME_CATEGORIES = [
  ...CATEGORY_LINKS.filter((item) => item.slug !== "condominios"),
  { slug: "lancamentos", type: "LAUNCH", label: "Lançamentos", href: "/#lancamentos" },
] as const;

export default async function HomePage() {
  const [portal, highlights, launches, facets, catalog] = await Promise.all([
    getPortalHome(),
    listHighlights({ limit: 8 }),
    listLaunches({ limit: 4 }),
    getFacets(),
    listProperties({ limit: 1 }),
  ]);
  const config = portal.data.config;
  const title = config?.heroTitle?.trim() || "Encontre o imóvel certo em Uberaba";
  const subtitle = config?.heroSubtitle?.trim() || SITE_DESCRIPTION;
  const name = companyName(config);
  const contactHref = attendanceWhatsappHref(config?.whatsapp, name);
  const aboutTitle = aboutSectionTitle(config, name);
  const creci = config?.creci?.trim() || null;
  const aboutText = config?.aboutText?.trim() || ABOUT_TEXT_FALLBACK;
  const aboutImage = config?.aboutImage?.trim() || config?.heroImage?.trim() || null;
  const differentials = portalDifferentials(config);
  const featured = highlights.data.data;
  const launchItems = launches.data.data;
  const source = highlights.source;
  const available = catalog.data.total;

  return (
    <div>
      <LocalBusinessJsonLd config={config} />
      <SourceBanner source={source} />
      <section className="relative overflow-hidden bg-[#000C24] text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
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
        <div className="relative mx-auto grid w-full max-w-[90rem] items-center gap-10 px-4 pb-16 pt-24 md:px-8 md:pt-28 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:pb-20 lg:pt-36 2xl:max-w-[110rem]">
          <div className="max-w-[720px]">
            {creci && (
              <p className="mb-5 inline-flex w-fit rounded-full border border-[#DEAE5D]/40 bg-[#DEAE5D]/10 px-3 py-1 text-xs font-semibold tracking-wide text-[#DEAE5D]">
                CRECI {creci}
              </p>
            )}
            <h1 className="text-[clamp(2.75rem,7vw,5.25rem)] font-extrabold leading-[0.98] tracking-tight">{title}</h1>
            <p className="mt-6 max-w-[38rem] text-lg leading-relaxed text-white/85 md:mt-7 md:text-xl">{subtitle}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/imoveis"
                className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#C09048] px-7 text-base font-semibold text-[#000C24] shadow-[0_16px_36px_-12px_rgba(222,174,93,.75)] transition-colors hover:bg-[#DEAE5D] sm:flex-none"
              >
                <Home className="size-5" aria-hidden />
                Ver imóveis
              </Link>
              {contactHref && (
                <TrackedAnchor
                  event="whatsapp_click"
                  eventLabel="hero"
                  href={contactHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#075E54] px-7 text-base font-semibold text-white shadow-[0_16px_36px_-14px_rgba(7,94,84,.9)] transition-colors hover:bg-[#0b7a6e] sm:flex-none"
                >
                  <MessageCircle className="size-5" aria-hidden />
                  Falar no WhatsApp
                </TrackedAnchor>
              )}
            </div>
            <InstitutionalStats available={available} creci={creci} compact />
          </div>
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-[30rem] lg:justify-self-end">
            <HeroFeaturedCard property={featured[0] ?? null} />
          </div>
        </div>
      </section>

      <section id="busca" className="scroll-mt-16 bg-[#F8F9FA] py-8 md:py-14">
        <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">Busca inteligente</h2>
          <p className="mt-2 max-w-2xl text-sm text-[#10294B]">
            Filtre por comprar, alugar, bairro, tipo e faixa de valor.
          </p>
          <div className="mt-5">
            <HeroSearch facets={facets.data} />
          </div>
        </div>
      </section>

      <InstitutionalStats available={available} creci={creci} />

      <section id="categorias" className="scroll-mt-16 mx-auto w-full max-w-[90rem] px-4 py-10 md:px-8 md:py-16 2xl:max-w-[110rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">Explore o catálogo</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">Categorias de imóveis</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {HOME_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug];
            const href = "href" in category ? category.href : `/imoveis/tipos/${category.slug}`;
            return (
              <CategoryCard
                key={category.slug}
                href={href}
                label={category.label}
                icon={Icon}
                tone={category.slug as CategoryTone}
              />
            );
          })}
        </div>
      </section>

      <section
        id="imoveis-destaque"
        className="scroll-mt-16 mx-auto w-full max-w-[90rem] px-4 py-8 md:px-8 md:py-14 2xl:max-w-[110rem]"
      >
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">Imóveis em destaque</h2>
          <Link href="/imoveis" className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-[#8a6a2f]">
            Ver todos
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="mx-auto mt-4 max-w-xl rounded-2xl bg-white px-6 py-8 text-center shadow-[0_10px_30px_rgba(0,12,36,.06)] md:mt-8">
            <p className="text-lg font-semibold text-[#000C24]">Novos imóveis serão publicados em breve.</p>
            <p className="mt-2 text-sm text-[#10294B]">Fale com um corretor para receber oportunidades.</p>
            {contactHref && (
              <TrackedAnchor
                event="whatsapp_click"
                eventLabel="destaque-vazio"
                href={contactHref}
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#075E54] px-6 text-sm font-semibold text-white hover:bg-[#0b7a6e]"
              >
                <MessageCircle className="size-4" aria-hidden />
                Falar no WhatsApp
              </TrackedAnchor>
            )}
          </div>
        ) : (
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-6 sm:mt-8 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                priority={index < 2}
                whatsappPhone={config?.whatsapp}
              />
            ))}
          </div>
        )}
      </section>

      <section id="lancamentos" className="scroll-mt-16 bg-[#F8F9FA] py-8 md:py-14">
        <div className="mx-auto w-full max-w-[90rem] space-y-4 px-4 md:space-y-6 md:px-8 2xl:max-w-[110rem]">
          <h2 className="text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">Lançamentos</h2>
          {launchItems.length === 0 ? (
            <p className="text-sm text-[#10294B]">Os lançamentos publicados aparecem nesta seção.</p>
          ) : (
            launchItems.map((property) => <LaunchCard key={property.id} property={property} />)
          )}
        </div>
      </section>

      <SocialProof />

      <section id="sobre" className="scroll-mt-16 bg-white">
        <div className="mx-auto grid w-full max-w-[90rem] items-center gap-8 px-4 py-12 md:gap-12 md:px-8 md:py-20 lg:grid-cols-2 2xl:max-w-[110rem]">
          <div className="relative min-h-72 overflow-hidden rounded-[28px] bg-[#000C24] shadow-[0_24px_50px_-28px_rgba(0,12,36,.65)]">
            {aboutImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={aboutImage}
                alt=""
                width={960}
                height={720}
                className="absolute inset-0 h-full w-full object-cover opacity-45"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="relative flex h-full min-h-72 flex-col justify-end p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#DEAE5D]">{name}</p>
              <p className="mt-4 max-w-md text-3xl font-extrabold leading-[1.05] tracking-tight text-white md:text-5xl">
                Mais que imóveis. Realizamos histórias.
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">Posicionamento</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#000C24] md:text-4xl">{aboutTitle}</h2>
            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-[#10294B] md:text-lg">{aboutText}</p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {differentials.map((item) => (
                <li key={item} className="rounded-2xl border-t-4 border-[#C09048] bg-[#F6F1E8] p-4 text-sm font-semibold text-[#000C24]">
                  {item}
                </li>
              ))}
            </ul>
            {contactHref ? (
              <TrackedAnchor
                event="whatsapp_click"
                eventLabel="sobre"
                href={contactHref}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#075E54] px-6 text-sm font-semibold text-white hover:bg-[#0b7a6e]"
              >
                <MessageCircle className="size-4" aria-hidden />
                Falar no WhatsApp
              </TrackedAnchor>
            ) : (
              <a
                href="#whatsapp"
                className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-[#C09048] px-6 text-sm font-semibold text-[#000C24] hover:bg-[#DEAE5D]"
              >
                Falar com a imobiliária
              </a>
            )}
          </div>
        </div>
      </section>

      <WhatsAppHighlight config={config} />
      <LocalSeo />
    </div>
  );
}
