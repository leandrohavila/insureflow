import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-16">
      <h1 className="text-xl font-semibold">Imóvel não encontrado</h1>
      <p className="text-sm text-muted-foreground">
        Só imóveis publicados no CRM aparecem neste portal.
      </p>
      <Link href="/imoveis" className="inline-flex min-h-11 items-center text-sm font-semibold text-[#8a6a2f] underline">
        Ver listagem
      </Link>
    </div>
  );
}
