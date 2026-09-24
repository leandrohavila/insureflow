import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { getPortalHome } from "@/services/catalog";

export default async function ImoveisLayout({ children }: { children: ReactNode }) {
  const portal = await getPortalHome();
  return (
    <>
      <SiteHeader config={portal.data.config} />
      {children}
    </>
  );
}
