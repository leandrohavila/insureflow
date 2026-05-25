type EntityKeyFactory<Root extends string> = {
  all: readonly [Root];
  lists: () => readonly [Root, "list"];
  list: (
    filters?: Record<string, unknown>,
  ) => readonly [Root, "list", Record<string, unknown>];
  details: () => readonly [Root, "detail"];
  detail: (id: string) => readonly [Root, "detail", string];
};

function entityKeys<Root extends string>(root: Root): EntityKeyFactory<Root> {
  return {
    all: [root] as const,
    lists: () => [root, "list"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      [root, "list", filters] as const,
    details: () => [root, "detail"] as const,
    detail: (id: string) => [root, "detail", id] as const,
  };
}

export const queryKeys = {
  session: {
    current: ["session", "current"] as const,
  },
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
  leads: {
    ...entityKeys("leads"),
    duplicates: (document: string, excludeId?: string) =>
      ["leads", "duplicates", document, excludeId ?? ""] as const,
    contexts: () => ["leads", "context"] as const,
    context: (id: string) => ["leads", "context", id] as const,
  },
  activities: entityKeys("activities"),
  questionnaires: {
    all: ["questionnaires"] as const,
    templates: {
      all: ["questionnaires", "templates"] as const,
      lists: () => ["questionnaires", "templates", "list"] as const,
      list: (filters: Record<string, unknown> = {}) =>
        ["questionnaires", "templates", "list", filters] as const,
      details: () => ["questionnaires", "templates", "detail"] as const,
      detail: (id: string) =>
        ["questionnaires", "templates", "detail", id] as const,
      fields: (templateId: string) =>
        [
          "questionnaires",
          "templates",
          "detail",
          templateId,
          "fields",
        ] as const,
      field: (templateId: string, fieldId: string) =>
        [
          "questionnaires",
          "templates",
          "detail",
          templateId,
          "fields",
          fieldId,
        ] as const,
    },
    submissions: {
      all: ["questionnaires", "submissions"] as const,
      lists: () => ["questionnaires", "submissions", "list"] as const,
      list: (filters: Record<string, unknown> = {}) =>
        ["questionnaires", "submissions", "list", filters] as const,
      byLead: (
        leadId: string,
        options: { templateId?: string; limit?: number } = {},
      ) =>
        [
          "questionnaires",
          "submissions",
          "byLead",
          leadId,
          options,
        ] as const,
      details: () => ["questionnaires", "submissions", "detail"] as const,
      detail: (id: string) =>
        ["questionnaires", "submissions", "detail", id] as const,
    },
  },
  companies: entityKeys("companies"),
  users: entityKeys("users"),
  policies: entityKeys("policies"),
  claims: entityKeys("claims"),
  whatsapp: entityKeys("whatsapp"),
} as const;

export type QueryKeys = typeof queryKeys;
