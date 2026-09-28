import { Building2, HeartHandshake, MapPin, MapPinned } from "lucide-react";

const STATS = [
  { icon: Building2, value: "150+", label: "Imóveis anunciados" },
  { icon: MapPinned, value: "20+", label: "Bairros atendidos" },
  { icon: HeartHandshake, value: "100%", label: "Atendimento personalizado" },
  { icon: MapPin, value: "Uberaba/MG", label: "Atuação local" },
] as const;

export function InstitutionalStats() {
  return (
    <section aria-label="Nossos números" className="pt-8 md:pt-12 lg:pt-28">
      <ul className="mx-auto grid w-full max-w-[90rem] grid-cols-2 gap-3 px-4 md:gap-5 md:px-8 lg:grid-cols-4 2xl:max-w-[110rem]">
        {STATS.map(({ icon: Icon, value, label }) => (
          <li
            key={label}
            className="flex flex-col items-start gap-3 rounded-[24px] bg-white p-4 shadow-[0_12px_32px_-18px_rgba(0,12,36,.2)] sm:p-5 md:flex-row md:items-center md:gap-4 md:p-6"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#000C24] text-[#DEAE5D] md:size-12">
              <Icon className="size-5 md:size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="break-words text-xl font-extrabold leading-none tracking-tight text-[#000C24] sm:text-2xl xl:text-3xl">{value}</p>
              <p className="mt-1.5 text-sm font-medium leading-snug text-[#3d4d66]">{label}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
