import { BadgeCheck, Building2, Handshake, Wallet } from "lucide-react";

const cardClass =
  "flex flex-col items-start gap-3 rounded-[24px] bg-white p-4 shadow-[0_12px_32px_-18px_rgba(0,12,36,.2)] sm:p-5 md:flex-row md:items-center md:gap-4 md:p-6";

export function InstitutionalStats({
  available,
  creci,
  compact = false,
}: {
  available: number | null;
  creci: string | null;
  compact?: boolean;
}) {
  const items = [
    {
      icon: Building2,
      value: available == null ? "—" : new Intl.NumberFormat("pt-BR").format(available),
      label: "Imóveis disponíveis",
    },
    {
      icon: Handshake,
      value: "Direto",
      label: "Clientes atendidos",
    },
    {
      icon: Wallet,
      value: "Local",
      label: "Valor negociado",
    },
    {
      icon: BadgeCheck,
      value: creci?.trim() || "A informar",
      label: "CRECI",
    },
  ] as const;

  if (compact) {
    return (
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Resumo da imobiliária">
        {items.map((item) => (
          <li key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
            <p className="text-lg font-extrabold leading-none text-white">{item.value}</p>
            <p className="mt-1 text-xs font-medium text-white/75">{item.label}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section aria-label="Nossos números" className="py-8 md:py-14">
      <div className="mx-auto w-full max-w-[90rem] px-4 md:px-8 2xl:max-w-[110rem]">
        <h2 className="text-2xl font-bold tracking-tight text-[#000C24] md:text-3xl">Números da imobiliária</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {items.map(({ icon: Icon, value, label }) => (
            <li key={label} className={cardClass}>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#000C24] text-[#DEAE5D] md:size-12">
                <Icon className="size-5 md:size-6" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="break-words text-xl font-extrabold leading-none tracking-tight text-[#000C24] sm:text-2xl xl:text-3xl">
                  {value}
                </p>
                <p className="mt-1.5 text-sm font-medium leading-snug text-[#3d4d66]">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
