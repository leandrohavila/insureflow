type TimelineQueryInput<T> = {
  queryKey: readonly unknown[]
  queryFn: () => Promise<T>
  enabled?: boolean
}

/**
 * A timeline acompanha eventos gravados fora desta aba.
 * Busca de novo ao focar a janela e ao observar a consulta outra vez.
 * Não define intervalo: a janela ativa não fica consultando sozinha.
 */
export function activityTimelineQueryOptions<T>({
  queryKey,
  queryFn,
  enabled = true,
}: TimelineQueryInput<T>) {
  return {
    queryKey,
    queryFn,
    enabled,
    staleTime: 0,
    refetchOnMount: "always" as const,
    refetchOnWindowFocus: "always" as const,
  }
}
