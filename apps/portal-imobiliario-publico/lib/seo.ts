import type { Metadata } from "next";

import { portalOrigin, toAbsoluteUrl } from "@/lib/site";

export const SITE_NAME = "Grupo Ávila Imóveis";

export const SITE_TITLE = "Grupo Ávila Imóveis | Imobiliária em Uberaba";

export const SITE_DESCRIPTION =
  "Encontre casas, apartamentos, terrenos e imóveis comerciais em Uberaba.";

export const OG_IMAGE_PATH = "/og-grupo-avila-imoveis.png";

export const OG_IMAGE = {
  url: OG_IMAGE_PATH,
  width: 1200,
  height: 630,
  alt: "Grupo Ávila Imóveis — imobiliária em Uberaba",
} as const;

export function whatsappShareHref(url?: string) {
  const link = url ?? portalOrigin();
  const text = `${SITE_TITLE}\n${SITE_DESCRIPTION}\n${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function brandMetadata(): Metadata {
  return {
    metadataBase: new URL(portalOrigin()),
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    openGraph: {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      locale: "pt_BR",
      type: "website",
      siteName: SITE_NAME,
      url: portalOrigin(),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE.url],
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: ["/favicon.ico"],
    },
  };
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const image = toAbsoluteUrl(OG_IMAGE_PATH);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      locale: "pt_BR",
      type: "website",
      url: path,
      images: [{ ...OG_IMAGE, url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
