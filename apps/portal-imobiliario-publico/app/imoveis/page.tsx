import { Suspense } from "react";

import { PropertyListing } from "@/components/property-listing";
import { SiteHeader } from "@/components/site-header";
import { getPortalHome } from "@/services/catalog";

export const dynamic = "force-dynamic";

export default async function ListingPage() {
  const portal = await getPortalHome();
  return (
    <>
      <SiteHeader config={portal.data.config} />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-8 md:px-8 2xl:max-w-[110rem]">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
          <PropertyListing />
        </Suspense>
      </main>
    </>
  );
}
