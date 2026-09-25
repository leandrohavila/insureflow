"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { companyName } from "@/lib/commercial";
import { cn } from "@/lib/utils";
import type { PortalConfig } from "@/types/property";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/imoveis", label: "Imóveis" },
  { href: "/#lancamentos", label: "Lançamentos" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#contato", label: "Contato" },
];

export function SiteHeader({
  config,
  overlay = false,
}: {
  config: PortalConfig | null;
  overlay?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const name = companyName(config);
  const creci = config?.creci?.trim() || null;

  return (
    <header
      className={cn(
        "z-30 w-full",
        overlay ? "absolute inset-x-0 top-0" : "sticky top-0 border-b border-white/10 bg-[#000C24]",
      )}
    >
      <div className="mx-auto flex h-12 w-full max-w-[90rem] items-center justify-between gap-3 px-4 md:h-16 md:px-8 2xl:max-w-[110rem]">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-white">
          <BrandLogo src={config?.logoUrl} name={name} plate />
          {creci && (
            <span className="hidden text-[11px] font-medium tracking-wide text-white/90 xl:inline">
              CRECI {creci}
            </span>
          )}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/90 lg:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center hover:text-[#DEAE5D]">
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-md text-white lg:hidden"
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav id="site-menu" className="border-t border-white/10 bg-[#000C24] px-4 py-2 lg:hidden">
          {creci && <p className="px-1 py-2 text-xs font-medium text-white/90">CRECI {creci}</p>}
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-11 items-center text-sm text-white hover:text-[#DEAE5D]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
