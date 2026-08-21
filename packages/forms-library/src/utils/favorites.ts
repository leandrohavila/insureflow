import type { LibraryFavorites } from "../metadata/types"

export const DEFAULT_FAVORITES: LibraryFavorites = {
  fieldIds: [],
  blockIds: [],
}

export function toggleFavoriteId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

export function isFavorite(ids: string[], id: string): boolean {
  return ids.includes(id)
}

export function parseFavoritesJson(raw: string | null): LibraryFavorites {
  if (!raw) return { ...DEFAULT_FAVORITES }
  try {
    const parsed = JSON.parse(raw) as Partial<LibraryFavorites>
    return {
      fieldIds: Array.isArray(parsed.fieldIds) ? parsed.fieldIds.filter(Boolean) : [],
      blockIds: Array.isArray(parsed.blockIds) ? parsed.blockIds.filter(Boolean) : [],
    }
  } catch {
    return { ...DEFAULT_FAVORITES }
  }
}

export function serializeFavorites(favorites: LibraryFavorites): string {
  return JSON.stringify(favorites)
}
