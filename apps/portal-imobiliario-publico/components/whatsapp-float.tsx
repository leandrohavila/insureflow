"use client";

import { usePathname } from "next/navigation";

import { whatsappHref } from "@/lib/commercial";

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-7 fill-current">
      <path d="M20.5 3.5A11 11 0 0 0 2.1 16.8L1 23l6.4-1.1A11 11 0 0 0 20.5 3.5ZM12 20.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.8.6.6-3.7-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.3a.5.5 0 0 0 0-.5c0-.1-.5-1.3-.7-1.7s-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 3.9 14 14 0 0 0 1.5.6 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.2-.1-.4-.2Z" />
    </svg>
  );
}

export function WhatsAppFloat({
  phone,
  companyName,
}: {
  phone: string | null | undefined;
  companyName: string;
}) {
  const pathname = usePathname();
  const href = phone ? whatsappHref(phone, `Olá, quero falar com a ${companyName}.`) : null;
  if (!href) return null;

  const aboveDetailBar = /^\/imoveis\/[^/]+$/.test(pathname);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Falar com ${companyName} no WhatsApp`}
      className={`whatsapp-float fixed z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#075E54] text-white shadow-[0_8px_24px_rgba(0,12,36,.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DEAE5D] ${aboveDetailBar ? "whatsapp-float-detail" : ""}`}
    >
      <WhatsAppIcon />
    </a>
  );
}
