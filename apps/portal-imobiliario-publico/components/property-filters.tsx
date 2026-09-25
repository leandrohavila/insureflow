"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

import { SearchSheet } from "@/components/search-sheet";
import { codeOnlyHref } from "@/lib/property-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { purposeLabel, typeLabel } from "@/lib/utils";
import { PROPERTY_PURPOSES, PROPERTY_TYPES, type PropertyListQuery } from "@/types/property";

const PURPOSE_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "SALE", label: "Venda" },
  { value: "RENT", label: "Locação" },
  { value: "SALE_AND_RENT", label: "Venda e locação" },
  { value: "SEASONAL", label: "Temporada" },
] as const;

const selectClass =
  "h-12 w-full rounded-md border border-border bg-background px-3 text-base text-[#000C24] outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-11 md:text-sm";

function activeFilterLabels(query: PropertyListQuery) {
  const items: string[] = [];
  if (query.q) items.push(query.q);
  if (query.purpose) items.push(purposeLabel(query.purpose));
  if (query.type) items.push(typeLabel(query.type));
  if (query.city) items.push(query.city);
  if (query.neighborhood) items.push(query.neighborhood);
  if (query.code) items.push(`Cód. ${query.code}`);
  if (query.priceMin) items.push(`Mín. ${query.priceMin}`);
  if (query.priceMax) items.push(`Máx. ${query.priceMax}`);
  return items;
}

function FilterForm({ query, idPrefix }: { query: PropertyListQuery; idPrefix: string }) {
  return (
    <form
      method="get"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(event) => {
        const href = codeOnlyHref(event.currentTarget);
        if (!href) return;
        event.preventDefault();
        window.location.assign(href);
      }}
    >
      <div className="sm:col-span-2 lg:col-span-3">
        <Label htmlFor={`${idPrefix}-q`}>Busca</Label>
        <Input
          id={`${idPrefix}-q`}
          name="q"
          defaultValue={query.q ?? ""}
          placeholder="Título, bairro, cidade"
          enterKeyHint="search"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-city`}>Cidade</Label>
        <Input
          id={`${idPrefix}-city`}
          name="city"
          defaultValue={query.city ?? ""}
          placeholder="Cuiabá"
          autoComplete="address-level2"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-neighborhood`}>Bairro</Label>
        <Input
          id={`${idPrefix}-neighborhood`}
          name="neighborhood"
          defaultValue={query.neighborhood ?? ""}
          placeholder="Centro"
          autoComplete="address-level3"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-type`}>Tipo</Label>
        <select id={`${idPrefix}-type`} name="type" defaultValue={query.type ?? ""} className={`${selectClass} mt-1`}>
          <option value="">Todos</option>
          {PROPERTY_TYPES.filter((type) => type !== "OTHER").map((type) => (
            <option key={type} value={type}>
              {typeLabel(type)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-code`}>Código</Label>
        <Input id={`${idPrefix}-code`} name="code" defaultValue={query.code ?? ""} className="mt-1" />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-purpose`}>Finalidade</Label>
        <select
          id={`${idPrefix}-purpose`}
          name="purpose"
          defaultValue={query.purpose ?? ""}
          className={`${selectClass} mt-1`}
        >
          {PURPOSE_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-price-min`}>Preço mín.</Label>
        <Input
          id={`${idPrefix}-price-min`}
          name="priceMin"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={query.priceMin ?? ""}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-price-max`}>Preço máx.</Label>
        <Input
          id={`${idPrefix}-price-max`}
          name="priceMax"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={query.priceMax ?? ""}
          className="mt-1"
        />
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="min-h-12 w-full bg-[#C09048] text-[#000C24] hover:bg-[#DEAE5D]">
          Buscar imóveis
        </Button>
      </div>
    </form>
  );
}

export function PropertyFilters({ query }: { query: PropertyListQuery }) {
  const [open, setOpen] = useState(false);
  const active = activeFilterLabels(query);

  return (
    <>
      <div className="space-y-2 md:hidden">
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl bg-[#C09048] px-4 text-left text-sm font-semibold text-[#000C24]"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[#8a6a2f]" aria-hidden />
            Buscar imóveis
          </span>
          <span className="rounded-full bg-[#000C24] px-2.5 py-1 text-xs font-semibold text-white">
            {active.length > 0 ? `${active.length} ${active.length === 1 ? "filtro" : "filtros"}` : "Filtros"}
          </span>
        </button>
        {active.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {active.map((item) => (
              <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#10294B]">
                {item}
              </span>
            ))}
            <Link href="/imoveis" className="inline-flex min-h-11 items-center px-1 text-xs font-semibold text-[#8a6a2f]">
              Limpar
            </Link>
          </div>
        )}
      </div>
      <div className="hidden rounded-xl border border-border bg-card p-4 md:block">
        <FilterForm query={query} idPrefix="listing" />
      </div>
      <SearchSheet open={open} onClose={() => setOpen(false)} title="Filtrar imóveis">
        <FilterForm query={query} idPrefix="listing-sheet" />
      </SearchSheet>
    </>
  );
}

export function parseListQuery(
  searchParams: Record<string, string | string[] | undefined>,
): PropertyListQuery {
  const read = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const purpose = read("purpose");
  const type = read("type");
  const priceMin = Number(read("priceMin"));
  const priceMax = Number(read("priceMax"));
  const page = Number(read("page"));

  return {
    q: read("q") || undefined,
    city: read("city") || undefined,
    neighborhood: read("neighborhood") || undefined,
    purpose:
      purpose && (PROPERTY_PURPOSES as readonly string[]).includes(purpose)
        ? (purpose as PropertyListQuery["purpose"])
        : undefined,
    type:
      type && (PROPERTY_TYPES as readonly string[]).includes(type)
        ? (type as PropertyListQuery["type"])
        : undefined,
    code: read("code") || undefined,
    priceMin: Number.isFinite(priceMin) && priceMin > 0 ? priceMin : undefined,
    priceMax: Number.isFinite(priceMax) && priceMax > 0 ? priceMax : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: 12,
  };
}
