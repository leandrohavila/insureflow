import { allBlocks } from "../blocks/index"
import { allCatalogFields } from "../fields/index"
import {
  FIELD_CATEGORY_LABELS,
  PRODUCT_LABELS,
} from "../metadata/categories"
import type {
  BlockDefinition,
  BlockSearchFilters,
  FieldCategoryId,
  FieldDefinition,
  FieldSearchFilters,
  InsuranceProductId,
} from "../metadata/types"

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function matchesQuery(item: { label: string; description: string; tags: string[] }, query?: string) {
  if (!query?.trim()) return true
  const q = normalize(query)
  return (
    normalize(item.label).includes(q) ||
    normalize(item.description).includes(q) ||
    item.tags.some((tag) => normalize(tag).includes(q))
  )
}

export function searchFields(filters: FieldSearchFilters = {}): FieldDefinition[] {
  return allCatalogFields.filter((field) => {
    if (filters.category && filters.category !== "all" && field.category !== filters.category) {
      return false
    }
    if (filters.product && filters.product !== "all") {
      if (filters.product === "shared") {
        if (field.product !== "shared") return false
      } else if (field.product !== filters.product && field.product !== "shared") {
        return false
      }
    }
    if (filters.tag && filters.tag !== "all") {
      if (!field.tags.some((tag) => normalize(tag) === normalize(filters.tag!))) return false
    }
    if (filters.inputKind && filters.inputKind !== "all" && field.inputKind !== filters.inputKind) {
      return false
    }
    return matchesQuery(field, filters.query)
  })
}

export function searchBlocks(filters: BlockSearchFilters = {}): BlockDefinition[] {
  return allBlocks.filter((block) => {
    if (filters.product && filters.product !== "all" && block.product !== filters.product) {
      return false
    }
    if (filters.tag && filters.tag !== "all") {
      if (!block.tags.some((tag) => normalize(tag) === normalize(filters.tag!))) return false
    }
    return matchesQuery(block, filters.query)
  })
}

export function groupFieldsByCategory(fields: FieldDefinition[]) {
  return (Object.keys(FIELD_CATEGORY_LABELS) as FieldCategoryId[])
    .map((category) => ({
      category,
      label: FIELD_CATEGORY_LABELS[category],
      items: fields.filter((field) => field.category === category),
    }))
    .filter((group) => group.items.length > 0)
}

export function groupBlocksByProduct(blocks: BlockDefinition[]) {
  const products: InsuranceProductId[] = ["auto", "vida", "residencial", "empresarial"]
  return products
    .map((product) => ({
      product,
      label: PRODUCT_LABELS[product],
      items: blocks.filter((block) => block.product === product),
    }))
    .filter((group) => group.items.length > 0)
}

export function listFieldTags(): string[] {
  const tags = new Set<string>()
  for (const field of allCatalogFields) {
    for (const tag of field.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b, "pt-BR"))
}

export function listBlockTags(): string[] {
  const tags = new Set<string>()
  for (const block of allBlocks) {
    for (const tag of block.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b, "pt-BR"))
}

export function sortWithFavorites<T extends { id: string }>(
  items: T[],
  favoriteIds: string[],
): T[] {
  const favorites = new Set(favoriteIds)
  return [...items].sort((a, b) => {
    const aFav = favorites.has(a.id)
    const bFav = favorites.has(b.id)
    if (aFav === bFav) return 0
    return aFav ? -1 : 1
  })
}
