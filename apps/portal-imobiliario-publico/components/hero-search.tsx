import { PROPERTY_PURPOSES, PROPERTY_TYPES, type CatalogFacets, type PropertyListQuery } from "@/types/property";
import { purposeLabel, typeLabel } from "@/lib/utils";

const fieldClass =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-sm normal-case text-foreground";

export function HeroSearch({
  facets,
  defaults,
  action = "/imoveis",
}: {
  facets: CatalogFacets;
  defaults?: PropertyListQuery;
  action?: string;
}) {
  return (
    <form
      action={action}
      className="grid gap-3 rounded-2xl border border-border bg-card p-4 text-foreground shadow-2xl md:grid-cols-2 md:p-5 lg:grid-cols-4 xl:grid-cols-8"
    >
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Finalidade
        <select name="purpose" defaultValue={defaults?.purpose ?? ""} className={fieldClass}>
          <option value="">Todas</option>
          {PROPERTY_PURPOSES.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purposeLabel(purpose)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Tipo
        <select name="type" defaultValue={defaults?.type ?? ""} className={fieldClass}>
          <option value="">Todos</option>
          {PROPERTY_TYPES.filter((type) => type !== "OTHER").map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Bairro
        <input
          name="neighborhood"
          list="portal-neighborhoods"
          defaultValue={defaults?.neighborhood ?? ""}
          className={fieldClass}
        />
        <datalist id="portal-neighborhoods">
          {facets.neighborhoods.map((item) => (
            <option key={item.slug} value={item.name} />
          ))}
        </datalist>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Cidade
        <input
          name="city"
          list="portal-cities"
          defaultValue={defaults?.city ?? ""}
          className={fieldClass}
        />
        <datalist id="portal-cities">
          {facets.cities.map((item) => (
            <option key={item.name} value={item.name} />
          ))}
        </datalist>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Valor mínimo
        <input
          name="priceMin"
          type="number"
          min={0}
          defaultValue={defaults?.priceMin ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Valor máximo
        <input
          name="priceMax"
          type="number"
          min={0}
          defaultValue={defaults?.priceMax ?? ""}
          className={fieldClass}
        />
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Código do imóvel
        <input name="code" defaultValue={defaults?.code ?? ""} className={fieldClass} />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-gold px-4 text-sm font-semibold tracking-wide text-navy-deep transition-colors hover:bg-gold-bright"
        >
          BUSCAR IMÓVEL
        </button>
      </div>
    </form>
  );
}
