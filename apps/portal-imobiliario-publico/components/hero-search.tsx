"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { SearchSheet } from "@/components/search-sheet";
import { codeOnlyHref } from "@/lib/property-code";
import { cn, typeLabel } from "@/lib/utils";
import { PROPERTY_TYPES, type CatalogFacets, type PropertyListQuery } from "@/types/property";

const controlClass =
  "h-12 w-full rounded-xl border border-[#E6E8EC] bg-[#F8F9FA] px-3 text-base text-[#000C24] outline-none transition-colors focus-visible:border-[#DEAE5D] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#DEAE5D]/60 md:text-sm";

const labelClass = "space-y-1.5 text-xs font-semibold uppercase tracking-wide text-[#10294B]";

function SearchForm({
  facets,
  defaults,
  action,
  idPrefix,
  showCode = false,
  className,
}: {
  facets: CatalogFacets;
  defaults?: PropertyListQuery;
  action: string;
  idPrefix: string;
  showCode?: boolean;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={cn("grid gap-3", className)}
      onSubmit={(event) => {
        const href = codeOnlyHref(event.currentTarget);
        if (!href) return;
        event.preventDefault();
        window.location.assign(href);
      }}
    >
      <label htmlFor={`${idPrefix}-purpose`} className={labelClass}>
        Comprar ou alugar
        <select
          id={`${idPrefix}-purpose`}
          name="purpose"
          defaultValue={defaults?.purpose ?? ""}
          className={controlClass}
        >
          <option value="">Comprar ou alugar</option>
          <option value="SALE">Comprar</option>
          <option value="RENT">Alugar</option>
        </select>
      </label>
      <label htmlFor={`${idPrefix}-neighborhood`} className={labelClass}>
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
      <label htmlFor={`${idPrefix}-type`} className={labelClass}>
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
      <label htmlFor={`${idPrefix}-price-min`} className={labelClass}>
        Valor mínimo
        <input
          id={`${idPrefix}-price-min`}
          name="priceMin"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="R$"
          defaultValue={defaults?.priceMin ?? ""}
          className={controlClass}
        />
      </label>
      <label htmlFor={`${idPrefix}-price-max`} className={labelClass}>
        Valor máximo
        <input
          id={`${idPrefix}-price-max`}
          name="priceMax"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="R$"
          defaultValue={defaults?.priceMax ?? ""}
          className={controlClass}
        />
      </label>
      {showCode && (
        <label htmlFor={`${idPrefix}-code`} className={labelClass}>
          Código do imóvel
          <input
            id={`${idPrefix}-code`}
            name="code"
            defaultValue={defaults?.code ?? ""}
            enterKeyHint="search"
            className={controlClass}
          />
        </label>
      )}
      <div className="flex items-end md:col-span-full xl:col-span-1">
        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C09048] px-5 text-sm font-semibold tracking-wide text-[#000C24] shadow-[0_12px_30px_-12px_rgba(192,144,72,.8)] transition-colors hover:bg-[#DEAE5D]"
        >
          <Search className="size-4" aria-hidden />
          Buscar Imóvel
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
          className="flex min-h-14 w-full items-center gap-3 rounded-[24px] bg-white px-5 text-left text-[#000C24] shadow-[0_24px_60px_-16px_rgba(0,0,0,.45)]"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Search className="size-5 shrink-0 text-[#C09048]" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Buscar imóveis</span>
            <span className="block truncate text-xs font-medium text-[#10294B]/80">
              Comprar, alugar, bairro, tipo ou valor
            </span>
          </span>
        </button>
      </div>
      <div className="hidden rounded-[24px] bg-white p-5 text-[#000C24] shadow-[0_30px_80px_-20px_rgba(0,12,36,.45),0_8px_24px_-8px_rgba(0,12,36,.2)] ring-1 ring-black/5 md:block lg:p-6">
        <SearchForm
          facets={facets}
          defaults={defaults}
          action={action}
          idPrefix="hero"
          className="md:grid-cols-2 xl:grid-cols-7"
        />
      </div>
      <SearchSheet open={open} onClose={() => setOpen(false)} title="Buscar imóveis">
        <SearchForm facets={facets} defaults={defaults} action={action} idPrefix="hero-sheet" />
      </SearchSheet>
    </>
  );
}
