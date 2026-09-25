import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PropertyGallery } from "@/components/property-gallery";
import { RealEstateListingJsonLd } from "@/components/listing-jsonld";
import { SiteHeader } from "@/components/site-header";
import { SourceBanner } from "@/components/source-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { whatsappHref } from "@/lib/commercial";
import { CatalogNotFoundError } from "@/lib/errors";
import { toAbsoluteUrl } from "@/lib/site";
import { cn, formatPrice, purposeLabel, resolveCover, typeLabel } from "@/lib/utils";
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
        images: cover
          ? [
              {
                url: toAbsoluteUrl(cover.url),
                alt: cover.alt ?? property.title,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: cover ? [toAbsoluteUrl(cover.url)] : undefined,
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
    const location = [property.address, property.neighborhood, property.city, property.state]
      .filter(Boolean)
      .join(" · ");
    const features = property.features ?? [];

    const portal = await getPortalHome();
    const whatsapp = portal.data.config?.whatsapp
      ? whatsappHref(
          portal.data.config.whatsapp,
          `Olá, tenho interesse no imóvel ${property.title} (${property.slug}).`,
        )
      : null;

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
        <div className="flex flex-wrap gap-1">
          <Badge>{purposeLabel(property.purpose)}</Badge>
          <Badge>{typeLabel(property.type)}</Badge>
        </div>
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{property.title}</h1>
        <p className="text-2xl font-bold text-[#000C24]">{formatPrice(property.price)}</p>
        <p className="text-sm font-medium text-[#10294B]">{location}</p>
        <p className="text-sm text-muted-foreground">
          {[
            property.bedrooms != null ? `${property.bedrooms} quartos` : null,
            property.bathrooms != null ? `${property.bathrooms} banheiros` : null,
            property.parkingSpots != null ? `${property.parkingSpots} vagas` : null,
            property.areaM2 != null ? `${property.areaM2} m²` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
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
            className={cn("mx-auto flex w-full max-w-5xl gap-2", whatsapp && "pr-16 md:pr-0")}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[#075E54] px-4 text-sm font-semibold text-white"
              >
                WhatsApp
              </a>
            )}
            <Link
              href={`/imoveis/${property.slug}/interesse`}
              className={cn(buttonVariants(), "inline-flex min-h-12 flex-1")}
            >
              Tenho interesse
            </Link>
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
