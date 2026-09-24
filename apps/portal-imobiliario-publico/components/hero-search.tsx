import { PROPERTY_PURPOSES, PROPERTY_TYPES, type CatalogFacets, type PropertyListQuery } from "@/types/property";
import { purposeLabel, typeLabel } from "@/lib/utils";

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
      className="grid gap-3 rounded-2xl bg-white p-4 text-[#1c1917] shadow-2xl md:grid-cols-2 md:p-5 lg:grid-cols-4 xl:grid-cols-8"
    >
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        Finalidade
        <select name="purpose" defaultValue={defaults?.purpose ?? ""} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm normal-case text-stone-900">
          <option value="">Todas</option>
          {PROPERTY_PURPOSES.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purposeLabel(purpose)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        Tipo
        <select name="type" defaultValue={defaults?.type ?? ""} className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm normal-case text-stone-900">
          <option value="">Todos</option>
          {PROPERTY_TYPES.filter((type) => type !== "OTHER").map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        Bairro
        <input
          name="neighborhood"
          list="portal-neighborhoods"
          defaultValue={defaults?.neighborhood ?? ""}
          className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm normal-case text-stone-900"
        />
        <datalist id="portal-neighborhoods">
          {facets.neighborhoods.map((item) => (
            <option key={item.slug} value={item.name} />
          ))}
        </datalist>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        Cidade
        <input
          name="city"
          list="portal-cities"
          defaultValue={defaults?.city ?? ""}
          className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm normal-case text-stone-900"
        />
        <datalist id="portal-cities">
          {facets.cities.map((item) => (
            <option key={item.name} value={item.name} />
          ))}
        </datalist>
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        Valor mínimo
        <input
          name="priceMin"
          type="number"
          min={0}
          defaultValue={defaults?.priceMin ?? ""}
          className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm normal-case text-stone-900"
        />
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        Valor máximo
        <input
          name="priceMax"
          type="number"
          min={0}
          defaultValue={defaults?.priceMax ?? ""}
          className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm normal-case text-stone-900"
        />
      </label>
      <label className="space-y-1 text-xs font-medium uppercase tracking-wide text-stone-500">
        Código do imóvel
        <input
          name="code"
          defaultValue={defaults?.code ?? ""}
          className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm normal-case text-stone-900"
        />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          className="h-11 w-full rounded-lg bg-[#123524] px-4 text-sm font-semibold tracking-wide text-white hover:bg-[#0d291b]"
        >
          BUSCAR IMÓVEL
        </button>
      </div>
    </form>
  );
}
