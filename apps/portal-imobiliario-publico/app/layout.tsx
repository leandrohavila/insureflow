import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { companyName } from "@/lib/commercial";
import { portalOrigin } from "@/lib/site";
import { cn } from "@/lib/utils";
import { getPortalHome } from "@/services/catalog";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#000C24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

function resourceOrigin(url: string | null | undefined) {
  const value = url?.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getPortalHome();
  const name = companyName(portal.data.config);
  const description = portal.data.config?.heroSubtitle?.trim() || `Portal de imóveis ${name}.`;
  const origin = portalOrigin();
  return {
    metadataBase: new URL(origin),
    alternates: { canonical: "/" },
    title: { default: name, template: `%s · ${name}` },
    description,
    openGraph: {
      url: origin,
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
  const config = portal.data.config;
  const name = companyName(config);
  const origins = [config?.heroImage, config?.logoUrl, config?.aboutImage]
    .map(resourceOrigin)
    .filter((origin, index, all): origin is string => Boolean(origin) && all.indexOf(origin) === index);

  return (
    <html lang="pt-BR">
      <body
        className={cn(
          "min-h-svh bg-[#F8F9FA] text-[#000C24] antialiased",
          config?.whatsapp && "pb-20",
        )}
      >
        {origins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} />
        ))}
        <a
          href="#conteudo"
          className="absolute left-4 top-3 z-[60] -translate-y-24 rounded-md bg-white px-4 py-3 text-sm font-semibold text-[#000C24] focus:translate-y-0"
        >
          Pular para o conteúdo
        </a>
        <div id="conteudo">{children}</div>
        <SiteFooter config={config} />
        <WhatsAppFloat phone={config?.whatsapp} companyName={name} />
      </body>
    </html>
  );
}
