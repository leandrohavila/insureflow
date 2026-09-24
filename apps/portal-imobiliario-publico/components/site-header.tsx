"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { GrupoAvilaLogo } from "@/components/grupo-avila-logo";
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

  return (
    <header
      className={cn(
        "z-30 w-full bg-navy-deep text-white",
        overlay ? "absolute inset-x-0 top-0" : "sticky top-0 border-b border-white/10",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-4 px-4 md:h-20 md:px-8 2xl:max-w-[110rem]">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-white">
          {config?.logoUrl ? (
            <span className="avila-logo-plate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.logoUrl}
                alt={name}
                className="h-10 w-auto max-w-[10rem] object-contain md:h-12"
              />
            </span>
          ) : (
            <GrupoAvilaLogo imageClassName="h-10 md:h-12" />
          )}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white lg:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-gold-bright">
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md text-white hover:text-gold-bright lg:hidden"
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-white/10 bg-navy-deep px-4 py-3 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm text-white hover:text-gold-bright"
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
