"use client"

import {
  DEFAULT_FAVORITES,
  parseFavoritesJson,
  serializeFavorites,
  type LibraryFavorites,
} from "@repo/forms-library"

const STORAGE_KEY = "insureflow:forms-library:favorites"

export function readLibraryFavorites(): LibraryFavorites {
  if (typeof window === "undefined") return { ...DEFAULT_FAVORITES }
  return parseFavoritesJson(localStorage.getItem(STORAGE_KEY))
}

export function writeLibraryFavorites(favorites: LibraryFavorites): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, serializeFavorites(favorites))
}

export function toggleFieldFavorite(fieldId: string): LibraryFavorites {
  const current = readLibraryFavorites()
  const next = {
    ...current,
    fieldIds: current.fieldIds.includes(fieldId)
      ? current.fieldIds.filter((id) => id !== fieldId)
      : [...current.fieldIds, fieldId],
  }
  writeLibraryFavorites(next)
  return next
}

export function toggleBlockFavorite(blockId: string): LibraryFavorites {
  const current = readLibraryFavorites()
  const next = {
    ...current,
    blockIds: current.blockIds.includes(blockId)
      ? current.blockIds.filter((id) => id !== blockId)
      : [...current.blockIds, blockId],
  }
  writeLibraryFavorites(next)
  return next
}
