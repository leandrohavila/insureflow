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
    pipelines: () => ["crm", "pipelines"] as const,
    executiveDashboard: (filters: Record<string, unknown> = {}) =>
      ["crm", "executive-dashboard", filters] as const,
    slaDashboard: (filters: Record<string, unknown> = {}) =>
      ["crm", "sla-dashboard", filters] as const,
    performance: (filters: Record<string, unknown> = {}) =>
      ["crm", "performance", filters] as const,
    ranking: (filters: Record<string, unknown> = {}) =>
      ["crm", "ranking", filters] as const,
    salesTargets: (filters: Record<string, unknown> = {}) =>
      ["crm", "sales-targets", filters] as const,
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
  businessUnits: {
    ...entityKeys("businessUnits"),
    context: () => ["businessUnits", "context"] as const,
  },
  leadLossReasons: entityKeys("leadLossReasons"),
  leadFollowUps: entityKeys("leadFollowUps"),
  policyRenewals: entityKeys("policyRenewals"),
  commercialImport: entityKeys("commercialImport"),
  commercialAgenda: entityKeys("commercialAgenda"),
  commercialDashboard: entityKeys("commercialDashboard"),
  customer360: entityKeys("customer360"),
  dashboard360: entityKeys("dashboard360"),
  opportunities: entityKeys("opportunities"),
  communications: {
    all: ["communications"] as const,
    lists: () => ["communications", "list"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["communications", "list", filters] as const,
    dashboard: (filters: Record<string, unknown> = {}) =>
      ["communications", "dashboard", filters] as const,
    provider: () => ["communications", "provider"] as const,
    evolutionHealth: () => ["communications", "evolution-health"] as const,
  },
  messageTemplates: entityKeys("messageTemplates"),
  automation: {
    all: ["automation"] as const,
    reactivationSettings: () =>
      ["automation", "reactivation", "settings"] as const,
    reactivationMetrics: () =>
      ["automation", "reactivation", "metrics"] as const,
  },
  crossSell: {
    all: ["crossSell"] as const,
    lists: () => ["crossSell", "list"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["crossSell", "list", filters] as const,
    metrics: () => ["crossSell", "metrics"] as const,
  },
  users: entityKeys("users"),
  policies: entityKeys("policies"),
  claims: entityKeys("claims"),
  properties: {
    ...entityKeys("properties"),
    leads: (businessUnitId?: string) =>
      ["properties", "leads", businessUnitId ?? ""] as const,
    dashboardStats: (filters: Record<string, unknown> = {}) =>
      ["properties", "dashboard-stats", filters] as const,
    persons: (search?: string) => ["properties", "persons", search ?? ""] as const,
  },
  whatsapp: entityKeys("whatsapp"),
  quotes: {
    all: ["quotes"] as const,
    metrics: () => ["quotes", "metrics"] as const,
    comparisons: {
      all: ["quotes", "comparisons"] as const,
      lists: () => ["quotes", "comparisons", "list"] as const,
      list: (filters: Record<string, unknown> = {}) =>
        ["quotes", "comparisons", "list", filters] as const,
      byDeal: (dealId: string, options: { limit?: number } = {}) =>
        ["quotes", "comparisons", "byDeal", dealId, options] as const,
      byLead: (leadId: string, options: { limit?: number } = {}) =>
        ["quotes", "comparisons", "byLead", leadId, options] as const,
      byCustomer: (customerId: string, options: { limit?: number } = {}) =>
        ["quotes", "comparisons", "byCustomer", customerId, options] as const,
      details: () => ["quotes", "comparisons", "detail"] as const,
      detail: (id: string) => ["quotes", "comparisons", "detail", id] as const,
    },
    proposals: {
      all: ["quotes", "proposals"] as const,
      lists: () => ["quotes", "proposals", "list"] as const,
      list: (filters: Record<string, unknown> = {}) =>
        ["quotes", "proposals", "list", filters] as const,
      byLead: (leadId: string, options: { limit?: number } = {}) =>
        ["quotes", "proposals", "byLead", leadId, options] as const,
      byDeal: (dealId: string, options: { limit?: number } = {}) =>
        ["quotes", "proposals", "byDeal", dealId, options] as const,
      byCustomer: (customerId: string, options: { limit?: number } = {}) =>
        ["quotes", "proposals", "byCustomer", customerId, options] as const,
      detail: (id: string) => ["quotes", "proposals", "detail", id] as const,
    },
  },
} as const;

export type QueryKeys = typeof queryKeys;
