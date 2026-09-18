import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROPERTY_PURPOSES, type PropertyListQuery } from "@/types/property";

const PURPOSE_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "SALE", label: "Venda" },
  { value: "RENT", label: "Aluguel" },
  { value: "SALE_AND_RENT", label: "Venda e aluguel" },
] as const;

export function PropertyFilters({ query }: { query: PropertyListQuery }) {
  return (
    <form method="get" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="sm:col-span-2 lg:col-span-3">
        <Label htmlFor="q">Busca</Label>
        <Input id="q" name="q" defaultValue={query.q ?? ""} placeholder="Título, bairro, cidade" />
      </div>
      <div>
        <Label htmlFor="city">Cidade</Label>
        <Input id="city" name="city" defaultValue={query.city ?? ""} placeholder="Cuiabá" />
      </div>
      <div>
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          name="neighborhood"
          defaultValue={query.neighborhood ?? ""}
          placeholder="Centro"
        />
      </div>
      <div>
        <Label htmlFor="purpose">Finalidade</Label>
        <select
          id="purpose"
          name="purpose"
          defaultValue={query.purpose ?? ""}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
        >
          {PURPOSE_OPTIONS.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="priceMin">Preço mín.</Label>
        <Input
          id="priceMin"
          name="priceMin"
          type="number"
          min={0}
          defaultValue={query.priceMin ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="priceMax">Preço máx.</Label>
        <Input
          id="priceMax"
          name="priceMax"
          type="number"
          min={0}
          defaultValue={query.priceMax ?? ""}
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Filtrar
        </Button>
      </div>
    </form>
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
    priceMin: Number.isFinite(priceMin) && priceMin > 0 ? priceMin : undefined,
    priceMax: Number.isFinite(priceMax) && priceMax > 0 ? priceMax : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: 12,
  };
}
