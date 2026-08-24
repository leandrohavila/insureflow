import { GrupoAvilaLogo } from "@/components/branding/grupo-avila-logo"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <div className="flex flex-col items-center justify-center bg-[#000C24] px-6 py-10 text-center lg:w-[42%] lg:px-10 lg:py-12">
        <GrupoAvilaLogo variant="plate" height={120} priority className="lg:hidden" />
        <GrupoAvilaLogo variant="plate" height={140} priority className="hidden lg:inline-flex" />
        <p className="mt-6 max-w-xs text-sm leading-relaxed text-[#d9d2c5]">
          Acesso ao workspace do Grupo Ávila
        </p>
        <ul className="mt-8 space-y-2 text-xs font-medium tracking-[0.14em] text-[#C09048] uppercase">
          <li>Ávila Corretora</li>
          <li>Ávila Imóveis</li>
        </ul>
      </div>
      <div className="avila-auth-panel flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 md:py-12">
        {children}
      </div>
    </div>
  )
}
