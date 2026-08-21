"use client"

import { memo, useMemo, useState } from "react"
import { Layers, Search, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  PRODUCT_LABELS,
  groupBlocksByProduct,
  searchBlocks,
  sortWithFavorites,
  type BlockDefinition,
  type InsuranceProductId,
} from "@repo/forms-library"
import { cn } from "@/lib/utils"
import {
  readLibraryFavorites,
  toggleBlockFavorite,
} from "@/lib/questionnaires/forms-library-storage"

import { resolveLibraryIcon } from "./forms-library-icons"

type BlockLibraryDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (block: BlockDefinition) => void
  disabled?: boolean
}

const PRODUCT_TABS: Exclude<InsuranceProductId, "shared">[] = [
  "auto",
  "vida",
  "residencial",
  "empresarial",
]

export const BlockLibraryDrawer = memo(function BlockLibraryDrawer({
  open,
  onOpenChange,
  onInsert,
  disabled,
}: BlockLibraryDrawerProps) {
  const [search, setSearch] = useState("")
  const [product, setProduct] = useState<(typeof PRODUCT_TABS)[number]>("auto")
  const [favorites, setFavorites] = useState(() => readLibraryFavorites())

  const blocks = useMemo(() => {
    const filtered = searchBlocks({ query: search, product })
    return sortWithFavorites(filtered, favorites.blockIds)
  }, [favorites.blockIds, product, search])

  const groups = useMemo(() => groupBlocksByProduct(blocks), [blocks])

  function handleInsert(block: BlockDefinition) {
    if (disabled) return
    onInsert(block)
    setSearch("")
  }

  function handleToggleFavorite(blockId: string) {
    setFavorites(toggleBlockFavorite(blockId))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-full flex-col border-white/[0.08] bg-background/98 p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-white/[0.06] p-[var(--if-space-4)]">
          <SheetTitle className="flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Inserir bloco
          </SheetTitle>
          <SheetDescription>
            Selecione o produto e o bloco — todas as perguntas são inseridas
            automaticamente.
          </SheetDescription>

          <div className="flex flex-wrap gap-1 pt-2">
            {PRODUCT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setProduct(tab)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  product === tab
                    ? "bg-primary/15 text-primary"
                    : "bg-white/[0.05] text-muted-foreground hover:text-foreground",
                )}
              >
                {PRODUCT_LABELS[tab]}
              </button>
            ))}
          </div>

          <div className="relative pt-2">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar bloco..."
              aria-label="Buscar blocos"
              className="pl-9"
            />
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-[var(--if-space-4)]">
          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum bloco encontrado.
            </p>
          ) : (
            <div className="space-y-[var(--if-space-5)]">
              {groups.map((group) => (
                <section key={group.product}>
                  <h3 className="mb-[var(--if-space-2)] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="space-y-[var(--if-space-2)]">
                    {group.items.map((block) => {
                      const Icon = resolveLibraryIcon(block.icon)
                      const isFavorite = favorites.blockIds.includes(block.id)
                      return (
                        <article
                          key={block.id}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-[var(--if-space-3)]"
                        >
                          <div className="flex items-start gap-[var(--if-space-3)]">
                            <div className="rounded-lg bg-white/[0.05] p-2">
                              <Icon className="size-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-sm font-semibold">
                                  {block.label}
                                </h4>
                                <button
                                  type="button"
                                  aria-label={
                                    isFavorite
                                      ? "Remover bloco favorito"
                                      : "Marcar bloco favorito"
                                  }
                                  onClick={() => handleToggleFavorite(block.id)}
                                  className="text-muted-foreground hover:text-amber-400"
                                >
                                  <Star
                                    className={cn(
                                      "size-3.5",
                                      isFavorite && "fill-amber-400 text-amber-400",
                                    )}
                                  />
                                </button>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {block.description}
                              </p>
                              <p className="mt-2 text-[11px] text-muted-foreground/80">
                                {block.preview.summary} · {block.preview.fieldCount}{" "}
                                campos
                                {block.defaultRules?.length
                                  ? ` · ${block.defaultRules.length} regra(s)`
                                  : ""}
                              </p>
                              <div className="mt-[var(--if-space-2)] flex flex-wrap gap-1">
                                {block.tags.slice(0, 4).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-[var(--if-space-3)] w-full"
                            disabled={disabled}
                            onClick={() => handleInsert(block)}
                          >
                            Inserir bloco
                          </Button>
                        </article>
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
