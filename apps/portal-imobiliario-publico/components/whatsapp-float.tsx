"use client";

import { usePathname } from "next/navigation";

import { TrackedAnchor } from "@/components/tracked-link";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { attendanceWhatsappHref } from "@/lib/commercial";

export function WhatsAppFloat({
  phone,
  companyName,
}: {
  phone: string | null | undefined;
  companyName: string;
}) {
  const pathname = usePathname();
  const href = attendanceWhatsappHref(phone, companyName);
  if (!href) return null;

  const aboveDetailBar = /^\/imoveis\/[^/]+$/.test(pathname);

  return (
    <TrackedAnchor
      event="whatsapp_click"
      eventLabel="botao-flutuante"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Falar com ${companyName} no WhatsApp`}
      className={`whatsapp-float fixed z-40 inline-flex size-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_rgba(0,12,36,.35),0_0_0_4px_rgba(222,174,93,.45)] hover:bg-[#0b7a6e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DEAE5D] ${aboveDetailBar ? "whatsapp-float-detail" : ""}`}
    >
      <WhatsAppIcon />
    </TrackedAnchor>
  );
}
