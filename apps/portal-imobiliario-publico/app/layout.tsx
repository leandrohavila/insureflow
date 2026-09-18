import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ávila Imóveis",
    template: "%s · Ávila Imóveis",
  },
  description: "Portal público de imóveis — Ávila Imóveis.",
  openGraph: {
    title: "Ávila Imóveis",
    description: "Imóveis à venda e para aluguel.",
    locale: "pt_BR",
    type: "website",
    siteName: "Ávila Imóveis",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ávila Imóveis",
    description: "Imóveis à venda e para aluguel.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-svh antialiased">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
