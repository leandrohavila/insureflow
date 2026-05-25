import type { QueryClient, QueryKey } from "@tanstack/react-query"

export type OptimisticSnapshot<T> = {
  queryKey: QueryKey
  previousData: T | undefined
}

export async function snapshotQuery<T>(
  queryClient: QueryClient,
  queryKey: QueryKey
): Promise<OptimisticSnapshot<T>> {
  await queryClient.cancelQueries({ queryKey })
  return {
    queryKey,
    previousData: queryClient.getQueryData<T>(queryKey),
  }
}

export function rollbackQuery<T>(
  queryClient: QueryClient,
  snapshot?: OptimisticSnapshot<T>
) {
  if (!snapshot) return
  queryClient.setQueryData(snapshot.queryKey, snapshot.previousData)
}

export function upsertListItem<TItem extends { id: string }>(
  items: TItem[] | undefined,
  nextItem: TItem
) {
  if (!items) return [nextItem]
  const exists = items.some((item) => item.id === nextItem.id)
  return exists
    ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
    : [nextItem, ...items]
}

export function patchListItem<TItem extends { id: string }>(
  items: TItem[] | undefined,
  id: string,
  patch: Partial<TItem>
) {
  return items?.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

export function removeListItem<TItem extends { id: string }>(
  items: TItem[] | undefined,
  id: string
) {
  return items?.filter((item) => item.id !== id)
}
