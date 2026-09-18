"use client"

import { memo, useMemo, useState } from "react"
import { Search, Star } from "lucide-react"

import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  FIELD_CATEGORIES,
  FIELD_CATEGORY_LABELS,
  INSURANCE_PRODUCTS,
  PRODUCT_LABELS,
  groupFieldsByCategory,
  listFieldTags,
  searchFields,
  sortWithFavorites,
  type FieldCategoryId,
  type FieldDefinition,
  type FieldInputKind,
  type InsuranceProductId,
} from "@repo/forms-library"
import { cn } from "@/lib/utils"
import {
  readLibraryFavorites,
  toggleFieldFavorite,
} from "@/lib/questionnaires/forms-library-storage"

import { resolveLibraryIcon } from "./forms-library-icons"

type FieldLibraryDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (field: FieldDefinition) => void
  disabled?: boolean
}

export const FieldLibraryDrawer = memo(function FieldLibraryDrawer({
  open,
  onOpenChange,
  onInsert,
  disabled,
}: FieldLibraryDrawerProps) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<FieldCategoryId | "all">("all")
  const [product, setProduct] = useState<InsuranceProductId | "all">("all")
  const [tag, setTag] = useState<string>("all")
  const [inputKind, setInputKind] = useState<FieldInputKind | "all">("all")
  const [favorites, setFavorites] = useState(() => readLibraryFavorites())

  const tags = useMemo(() => listFieldTags(), [])

  const filtered = useMemo(() => {
    const items = searchFields({
      query: search,
      category,
      product,
      tag,
      inputKind,
    })
    return sortWithFavorites(items, favorites.fieldIds)
  }, [category, favorites.fieldIds, inputKind, product, search, tag])

  const groups = useMemo(() => groupFieldsByCategory(filtered), [filtered])

  function handleInsert(field: FieldDefinition) {
    if (disabled) return
    onInsert(field)
    setSearch("")
  }

  function handleToggleFavorite(fieldId: string) {
    setFavorites(toggleFieldFavorite(fieldId))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-full flex-col border-white/[0.08] bg-background/98 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-white/[0.06] p-[var(--if-space-4)]">
          <SheetTitle>Inserir campo</SheetTitle>
          <SheetDescription>
            Biblioteca de campos especializados com validação do motor
            compartilhado.
          </SheetDescription>

          <div className="grid gap-2 pt-2 sm:grid-cols-2">
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as FieldCategoryId | "all")
              }
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-xs"
              aria-label="Filtrar por categoria"
            >
              <option value="all">Todas categorias</option>
              {FIELD_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {FIELD_CATEGORY_LABELS[item]}
                </option>
              ))}
            </select>
            <select
              value={product}
              onChange={(event) =>
                setProduct(event.target.value as InsuranceProductId | "all")
              }
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-xs"
              aria-label="Filtrar por produto"
            >
              <option value="all">Todos produtos</option>
              {INSURANCE_PRODUCTS.map((item) => (
                <option key={item} value={item}>
                  {PRODUCT_LABELS[item]}
                </option>
              ))}
            </select>
            <select
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-xs"
              aria-label="Filtrar por tag"
            >
              <option value="all">Todas tags</option>
              {tags.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={inputKind}
              onChange={(event) =>
                setInputKind(event.target.value as FieldInputKind | "all")
              }
              className="h-8 rounded-md border border-input bg-background/40 px-2 text-xs"
              aria-label="Filtrar por tipo"
            >
              <option value="all">Todos tipos</option>
              <option value="short_text">Texto</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="plate">Placa</option>
              <option value="yes_no">Sim/Não</option>
              <option value="single_choice">Seleção</option>
              <option value="currency">Moeda</option>
              <option value="file">Arquivo</option>
            </select>
          </div>

          <div className="relative pt-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar campo..."
              aria-label="Buscar na biblioteca"
              className="pl-9"
            />
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-[var(--if-space-4)]">
          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum campo encontrado.
            </p>
          ) : (
            <div className="space-y-[var(--if-space-5)]">
              {groups.map((group) => (
                <section key={group.category}>
                  <h3 className="mb-[var(--if-space-2)] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-1 gap-[var(--if-space-2)]">
                    {group.items.map((item) => {
                      const Icon = resolveLibraryIcon(item.icon)
                      const isFavorite = favorites.fieldIds.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={disabled}
                          data-library-field={item.id}
                          onClick={() => handleInsert(item)}
                          className={cn(
                            "flex items-start gap-[var(--if-space-2)] rounded-xl border border-white/[0.08] bg-white/[0.03] px-[var(--if-space-3)] py-[var(--if-space-3)] text-left text-sm transition-colors",
                            "hover:border-white/[0.14] hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            "disabled:cursor-not-allowed disabled:opacity-40",
                          )}
                        >
                          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {item.label}
                              </span>
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={
                                  isFavorite
                                    ? "Remover campo favorito"
                                    : "Marcar campo favorito"
                                }
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleToggleFavorite(item.id)
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    handleToggleFavorite(item.id)
                                  }
                                }}
                                className="text-muted-foreground hover:text-amber-400"
                              >
                                <Star
                                  className={cn(
                                    "size-3.5",
                                    isFavorite && "fill-amber-400 text-amber-400",
                                  )}
                                />
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
})
