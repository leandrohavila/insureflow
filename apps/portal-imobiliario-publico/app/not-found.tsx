import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Imóvel não encontrado</h1>
      <p className="text-sm text-muted-foreground">
        Só imóveis publicados no CRM aparecem neste portal.
      </p>
      <Link href="/imoveis" className="text-sm text-primary underline">
        Ver listagem
      </Link>
    </div>
  );
}
