"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { SearchSheet } from "@/components/search-sheet";
import { purposeLabel, typeLabel } from "@/lib/utils";
import { PROPERTY_PURPOSES, PROPERTY_TYPES, type CatalogFacets, type PropertyListQuery } from "@/types/property";

const controlClass =
  "h-12 w-full rounded-lg border border-[#E6E8EC] bg-white px-3 text-base text-[#000C24] outline-none focus-visible:ring-2 focus-visible:ring-[#DEAE5D] md:h-11 md:text-sm";

function SearchForm({
  facets,
  defaults,
  action,
  idPrefix,
}: {
  facets: CatalogFacets;
  defaults?: PropertyListQuery;
  action: string;
  idPrefix: string;
}) {
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <label htmlFor={`${idPrefix}-purpose`} className="space-y-1 text-xs font-semibold text-[#10294B]">
        Finalidade
        <select
          id={`${idPrefix}-purpose`}
          name="purpose"
          defaultValue={defaults?.purpose ?? ""}
          className={controlClass}
        >
          <option value="">Todas</option>
          {PROPERTY_PURPOSES.map((purpose) => (
            <option key={purpose} value={purpose}>
              {purposeLabel(purpose)}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${idPrefix}-type`} className="space-y-1 text-xs font-semibold text-[#10294B]">
        Tipo
        <select id={`${idPrefix}-type`} name="type" defaultValue={defaults?.type ?? ""} className={controlClass}>
          <option value="">Todos</option>
          {PROPERTY_TYPES.filter((type) => type !== "OTHER").map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${idPrefix}-neighborhood`} className="space-y-1 text-xs font-semibold text-[#10294B]">
        Bairro
        <input
          id={`${idPrefix}-neighborhood`}
          name="neighborhood"
          list={`${idPrefix}-neighborhoods`}
          defaultValue={defaults?.neighborhood ?? ""}
          enterKeyHint="search"
          autoComplete="address-level3"
          className={controlClass}
        />
        <datalist id={`${idPrefix}-neighborhoods`}>
          {facets.neighborhoods.map((item) => (
            <option key={item.slug} value={item.name} />
          ))}
        </datalist>
      </label>
      <label htmlFor={`${idPrefix}-city`} className="space-y-1 text-xs font-semibold text-[#10294B]">
        Cidade
        <input
          id={`${idPrefix}-city`}
          name="city"
          list={`${idPrefix}-cities`}
          defaultValue={defaults?.city ?? ""}
          enterKeyHint="search"
          autoComplete="address-level2"
          className={controlClass}
        />
        <datalist id={`${idPrefix}-cities`}>
          {facets.cities.map((item) => (
            <option key={item.name} value={item.name} />
          ))}
        </datalist>
      </label>
      <label htmlFor={`${idPrefix}-price-min`} className="space-y-1 text-xs font-semibold text-[#10294B]">
        Valor mínimo
        <input
          id={`${idPrefix}-price-min`}
          name="priceMin"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={defaults?.priceMin ?? ""}
          className={controlClass}
        />
      </label>
      <label htmlFor={`${idPrefix}-price-max`} className="space-y-1 text-xs font-semibold text-[#10294B]">
        Valor máximo
        <input
          id={`${idPrefix}-price-max`}
          name="priceMax"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={defaults?.priceMax ?? ""}
          className={controlClass}
        />
      </label>
      <label htmlFor={`${idPrefix}-code`} className="space-y-1 text-xs font-semibold text-[#10294B]">
        Código do imóvel
        <input
          id={`${idPrefix}-code`}
          name="code"
          defaultValue={defaults?.code ?? ""}
          enterKeyHint="search"
          className={controlClass}
        />
      </label>
      <div className="flex items-end">
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#C09048] px-4 text-sm font-semibold tracking-wide text-[#000C24] hover:bg-[#DEAE5D] md:min-h-11"
        >
          Buscar imóvel
        </button>
      </div>
    </form>
  );
}

export function HeroSearch({
  facets,
  defaults,
  action = "/imoveis",
}: {
  facets: CatalogFacets;
  defaults?: PropertyListQuery;
  action?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden">
        <button
          type="button"
          className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left text-[#000C24] shadow-[0_12px_40px_rgba(0,0,0,.18)]"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Search className="size-5 shrink-0 text-[#8a6a2f]" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Buscar imóveis</span>
            <span className="block truncate text-xs font-medium text-[#10294B]">
              Finalidade, tipo, bairro, cidade ou código
            </span>
          </span>
        </button>
      </div>
      <div className="hidden rounded-[20px] bg-white p-4 text-[#000C24] shadow-[0_20px_60px_rgba(0,0,0,.15)] md:block md:p-5">
        <SearchForm facets={facets} defaults={defaults} action={action} idPrefix="hero" />
      </div>
      <SearchSheet open={open} onClose={() => setOpen(false)} title="Buscar imóveis">
        <SearchForm facets={facets} defaults={defaults} action={action} idPrefix="hero-sheet" />
      </SearchSheet>
    </>
  );
}
