import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MapPin, MessageCircle, Share2 } from "lucide-react";

import { PropertyGallery } from "@/components/property-gallery";
import { RealEstateListingJsonLd } from "@/components/listing-jsonld";
import { SiteHeader } from "@/components/site-header";
import { SourceBanner } from "@/components/source-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { TrackedAnchor, TrackedLink } from "@/components/tracked-link";
import { propertyShareHref, propertyWhatsappHref } from "@/lib/commercial";
import { CatalogNotFoundError } from "@/lib/errors";
import { OG_IMAGE_PATH } from "@/lib/seo";
import { toAbsoluteUrl } from "@/lib/site";
import {
  cn,
  formatArea,
  formatBathrooms,
  formatParking,
  formatPrice,
  formatRooms,
  isExclusiveListing,
  purposeLabel,
  resolveCover,
  typeLabel,
} from "@/lib/utils";
import { getPortalHome, getPropertyBySlug } from "@/services/catalog";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function descriptionOf(property: {
  description: string | null;
  metaDescription?: string | null;
  city: string;
  neighborhood: string | null;
  title: string;
}) {
  const custom = property.metaDescription?.trim();
  if (custom) return custom.slice(0, 160);
  const fromBody = property.description?.trim();
  if (fromBody) return fromBody.slice(0, 160);
  const place = [property.neighborhood, property.city].filter(Boolean).join(", ");
  return `${property.title}${place ? ` em ${place}` : ""}`.slice(0, 160);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { data: property } = await getPropertyBySlug(slug);
    const cover = resolveCover(property);
    const description = descriptionOf(property);
    const title = property.metaTitle?.trim() || property.title;
    return {
      title,
      description,
      alternates: { canonical: `/imoveis/${property.slug}` },
      openGraph: {
        title,
        description,
        type: "website",
        locale: "pt_BR",
        images: [
          cover
            ? { url: toAbsoluteUrl(cover.url), alt: cover.alt ?? property.title }
            : { url: toAbsoluteUrl(OG_IMAGE_PATH), alt: "Grupo Ávila Imóveis" },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [cover ? toAbsoluteUrl(cover.url) : toAbsoluteUrl(OG_IMAGE_PATH)],
      },
    };
  } catch {
    return { title: "Imóvel" };
  }
}

function formatFeatureValue(value: boolean | string | number | null) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  try {
    const { data: property, source } = await getPropertyBySlug(slug);
    if (decodeURIComponent(slug) !== property.slug) {
      permanentRedirect(`/imoveis/${property.slug}`);
    }
    const location = [property.address, property.neighborhood, property.city, property.state]
      .filter(Boolean)
      .join(" · ");
    const features = property.features ?? [];

    const portal = await getPortalHome();
    const whatsapp = propertyWhatsappHref(portal.data.config?.whatsapp, property);

    return (
      <>
      <SiteHeader config={portal.data.config} />
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 pb-28 md:py-8 md:pb-8">
        <RealEstateListingJsonLd property={property} />
        <SourceBanner source={source} />
        <Link href="/imoveis" className="inline-flex min-h-11 items-center text-sm font-medium text-[#10294B]">
          ← Voltar à listagem
        </Link>
        <PropertyGallery images={property.images ?? []} title={property.title} />
        <div className="flex flex-wrap gap-2">
          {property.featured === true && (
            <Badge className="bg-[#DEAE5D] font-bold text-[#000C24]">Destaque</Badge>
          )}
          {isExclusiveListing(property.features) && (
            <Badge className="bg-[#000C24] font-bold text-[#DEAE5D]">Exclusivo</Badge>
          )}
          <Badge>{purposeLabel(property.purpose)}</Badge>
          <Badge>{typeLabel(property.type)}</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">{property.title}</h1>
        <p className="text-3xl font-extrabold tracking-tight text-[#7F5209] md:text-4xl">{formatPrice(property.price)}</p>
        {property.publicCode && (
          <p className="text-sm font-semibold text-[#10294B]">Cód. {property.publicCode}</p>
        )}
        {location && (
          <p className="inline-flex w-fit max-w-full items-start gap-2 rounded-full bg-[#F6F1E8] px-3 py-1.5 text-sm font-semibold text-[#000C24]">
            <MapPin className="mt-0.5 size-4 shrink-0 text-[#8a6a2f]" aria-hidden />
            {location}
          </p>
        )}
        <p className="text-sm font-medium text-[#10294B]">
          {[
            property.bedrooms != null ? formatRooms(property.bedrooms) : null,
            property.bathrooms != null ? formatBathrooms(property.bathrooms) : null,
            property.parkingSpots != null ? formatParking(property.parkingSpots) : null,
            property.areaM2 != null ? formatArea(property.areaM2) : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <TrackedAnchor
          event="whatsapp_click"
          eventLabel="compartilhar-detalhe"
          propertySlug={property.slug}
          href={propertyShareHref(property)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[#E6E8EC] bg-white px-4 text-sm font-semibold text-[#000C24] hover:border-[#C09048]"
        >
          <Share2 className="size-4" aria-hidden />
          Compartilhar imóvel
        </TrackedAnchor>
        {property.primaryOwner?.name && (
          <p className="text-sm text-muted-foreground">
            Proprietário: {property.primaryOwner.name}
          </p>
        )}
        {property.description && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{property.description}</p>
        )}
        {features.length > 0 && (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature.key}>
                <span className="text-muted-foreground">{feature.label}: </span>
                {formatFeatureValue(feature.value)}
              </li>
            ))}
          </ul>
        )}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E6E8EC] bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <div
            className={cn(
              "mx-auto grid w-full max-w-5xl grid-cols-2 gap-2 sm:grid-cols-3",
              whatsapp && "pr-16 md:pr-0",
            )}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {whatsapp && (
              <TrackedAnchor
                event="whatsapp_click"
                eventLabel="detalhe-imovel"
                propertySlug={property.slug}
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#075E54] px-2 text-sm font-semibold text-white hover:bg-[#0b7a6e]"
              >
                <MessageCircle className="size-4" aria-hidden />
                WhatsApp
              </TrackedAnchor>
            )}
            <TrackedLink
              event="interest_click"
              eventLabel="detalhe-imovel"
              propertySlug={property.slug}
              href={`/imoveis/${property.slug}/interesse`}
              className={cn(buttonVariants(), "inline-flex min-h-12 px-2 text-sm")}
            >
              Tenho interesse
            </TrackedLink>
            <TrackedLink
              event="visit_click"
              eventLabel="detalhe-imovel"
              propertySlug={property.slug}
              href={`/imoveis/${property.slug}/interesse?intent=visita`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#000C24] px-2 text-sm font-semibold text-[#000C24]"
            >
              Agendar visita
            </TrackedLink>
          </div>
        </div>
      </div>
      </>
    );
  } catch (error) {
    if (error instanceof CatalogNotFoundError) notFound();
    throw error;
  }
}
