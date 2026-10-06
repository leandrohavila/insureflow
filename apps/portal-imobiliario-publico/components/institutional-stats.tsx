import { BadgeCheck, Building2, Handshake, Wallet } from "lucide-react";

import { resolvePortalMetrics } from "@/lib/portal-metrics";

const ICONS = [Building2, Handshake, Wallet, BadgeCheck] as const;

export function InstitutionalStats({
  available,
  creci,
  compact = false,
}: {
  available: number | null;
  creci: string | null;
  compact?: boolean;
}) {
  const items = resolvePortalMetrics({ available, creci }).map((item, index) => ({
    ...item,
    icon: ICONS[index] ?? BadgeCheck,
  }));

  if (compact) {
    return (
      <ul className="mt-10 grid grid-cols-2 gap-3" aria-label="Resumo da imobiliária">
        {items.map(({ icon: Icon, value, label }) => (
          <li key={label} className="min-w-0 rounded-2xl bg-white/10 px-3 py-3 ring-1 ring-white/15">
            <Icon className="size-4 text-[#DEAE5D]" aria-hidden />
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#DEAE5D]">{label}</p>
            <p className="mt-1 break-words text-base font-extrabold leading-tight text-white sm:text-lg">{value}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-label="Nossos números" className="bg-[#F6F1E8] py-10 md:py-16">
      <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6a2f]">Autoridade local</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">Confiança em números</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {items.map(({ icon: Icon, value, label }) => (
            <li
              key={label}
              className="flex min-w-0 flex-col gap-4 rounded-[24px] border border-[#E6E8EC] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(0,12,36,.35)] md:p-6"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[#000C24] text-[#DEAE5D]">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8a6a2f]">{label}</p>
                <p className="mt-2 break-words text-2xl font-extrabold leading-none tracking-tight text-[#000C24] xl:text-3xl">
                  {value}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
