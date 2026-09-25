import type { Metadata } from "next";
import { Suspense } from "react";

import { PropertyListing } from "@/components/property-listing";
import { SiteHeader } from "@/components/site-header";
import { portalOrigin } from "@/lib/site";
import { getPortalHome } from "@/services/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imóveis",
  description: "Imóveis publicados no portal.",
  alternates: { canonical: "/imoveis" },
  openGraph: {
    url: `${portalOrigin()}/imoveis`,
    title: "Imóveis",
    description: "Imóveis publicados no portal.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Imóveis",
    description: "Imóveis publicados no portal.",
  },
};

export default async function ListingPage() {
  const portal = await getPortalHome();
  return (
    <>
      <SiteHeader config={portal.data.config} />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-4 md:px-8 md:py-8 2xl:max-w-[110rem]">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
          <PropertyListing />
        </Suspense>
      </main>
    </>
  );
}
