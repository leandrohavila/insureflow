import { QueryClient } from "@tanstack/react-query"

import { getErrorMessage } from "@/lib/data-access/errors"

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (failureCount >= 1) return false
          return getErrorMessage(error) !== "Não autenticado"
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
