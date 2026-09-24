import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-16">
      <h1 className="text-xl font-semibold text-navy">Imóvel não encontrado</h1>
      <p className="text-sm text-muted-foreground">
        Só imóveis publicados no CRM aparecem neste portal.
      </p>
      <Link href="/imoveis" className="text-sm text-primary underline">
        Ver listagem
      </Link>
    </div>
  );
}
