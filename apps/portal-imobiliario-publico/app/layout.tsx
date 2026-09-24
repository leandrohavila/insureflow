import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { companyName } from "@/lib/commercial";
import { getPortalHome } from "@/services/catalog";

import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortalHome();
  const name = companyName(portal.data.config);
  const description = portal.data.config?.heroSubtitle?.trim() || `Portal de imóveis ${name}.`;
  return {
    title: { default: name, template: `%s · ${name}` },
    description,
    openGraph: {
      title: name,
      description,
      locale: "pt_BR",
      type: "website",
      siteName: name,
    },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const portal = await getPortalHome();
  return (
    <html lang="pt-BR">
      <body className="min-h-svh bg-[#f6f3ee] text-[#1c1917] antialiased">
        {children}
        <SiteFooter config={portal.data.config} />
      </body>
    </html>
  );
}
