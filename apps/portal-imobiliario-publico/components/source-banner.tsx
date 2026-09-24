import type { CatalogSource } from "@/types/property";

export function SourceBanner({ source }: { source: CatalogSource }) {
  if (source !== "mock") return null;
  return (
    <div
      role="status"
      className="bg-gold-bright px-4 py-2 text-center text-xs text-navy-deep"
    >
      Catálogo mock ativo — a API pública não respondeu. Leads desta sessão não
      chegam ao CRM.
    </div>
  );
}
