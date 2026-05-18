type EntityKeyFactory<Root extends string> = {
  all: readonly [Root]
  lists: () => readonly [Root, "list"]
  list: (
    filters?: Record<string, unknown>,
  ) => readonly [Root, "list", Record<string, unknown>]
  details: () => readonly [Root, "detail"]
  detail: (id: string) => readonly [Root, "detail", string]
}

function entityKeys<Root extends string>(root: Root): EntityKeyFactory<Root> {
  return {
    all: [root] as const,
    lists: () => [root, "list"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      [root, "list", filters] as const,
    details: () => [root, "detail"] as const,
    detail: (id: string) => [root, "detail", id] as const,
  }
}

export const queryKeys = {
  crm: {
    all: ["crm"] as const,
    deals: {
      all: ["crm", "deals"] as const,
      lists: () => ["crm", "deals", "list"] as const,
      list: (filters: Record<string, unknown> = {}) =>
        ["crm", "deals", "list", filters] as const,
      details: () => ["crm", "deals", "detail"] as const,
      detail: (id: string) => ["crm", "deals", "detail", id] as const,
    },
  },
  customers: entityKeys("customers"),
  clients: entityKeys("clients"),
  leads: entityKeys("leads"),
  companies: entityKeys("companies"),
  users: entityKeys("users"),
  policies: entityKeys("policies"),
  claims: entityKeys("claims"),
  whatsapp: entityKeys("whatsapp"),
} as const

export type QueryKeys = typeof queryKeys
