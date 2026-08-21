export const dsLayout = {
  page: {
    maxWidth: "1600px",
    className:
      "mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-[var(--if-layout-page-x)] py-[var(--if-layout-page-y)]",
    /** Páginas operacionais com workspace fill — padding vertical mínimo. */
    operationalFill: {
      className:
        "mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden px-[var(--if-layout-page-x)] pb-[var(--if-layout-page-x)] pt-[var(--if-space-4)]",
    },
  },
  content: {
    variants: {
      operational: {
        maxWidth: "1600px",
        className: "mx-auto w-full max-w-[var(--if-layout-operational-max)]",
      },
      /** Conteúdo operacional que preenche altura (Header · KPIs · Workspace). */
      operationalFill: {
        maxWidth: "1600px",
        className:
          "mx-auto flex min-h-0 w-full max-w-[var(--if-layout-operational-max)] flex-1 flex-col overflow-hidden",
      },
      reading: {
        maxWidth: "1200px",
        className: "mx-auto w-full max-w-[var(--if-layout-reading-max)]",
      },
      modal: {
        maxWidth: "960px",
        className: "mx-auto w-full max-w-[var(--if-layout-modal-max)]",
      },
      embedded: {
        maxWidth: "100%",
        className: "w-full min-w-0 max-w-[var(--if-layout-embedded-max)]",
      },
    },
  },
  section: {
    className:
      "flex min-w-0 w-full flex-col gap-[var(--if-layout-section-gap)]",
  },
  pageHeader: {
    className: "flex min-w-0 w-full flex-col gap-[var(--if-space-3)]",
    compact: {
      className: "flex min-w-0 w-full flex-col gap-[var(--if-space-1-5)]",
    },
    titleRow: {
      className:
        "flex min-w-0 flex-col gap-[var(--if-space-3)] sm:flex-row sm:items-center sm:justify-between",
    },
    content: {
      className: "min-w-0 flex-1 space-y-[var(--if-space-1-5)]",
    },
    actions: {
      className: "flex shrink-0 items-center justify-end",
    },
  },
  pageActions: {
    className:
      "flex flex-wrap items-center justify-end gap-[var(--if-layout-page-actions-gap)] sm:flex-nowrap",
  },
  pageActionsGroup: {
    className:
      "flex flex-nowrap items-center gap-[var(--if-layout-page-actions-group-gap)]",
  },
  pageActionsGroupPrimary: {
    className:
      "flex flex-nowrap items-center gap-[var(--if-layout-page-actions-primary-gap)]",
  },
  filterBar: {
    className:
      "flex min-w-0 w-full flex-wrap items-center gap-[var(--if-layout-control-gap)]",
  },
  toolbar: {
    className:
      "flex min-w-0 w-full flex-col gap-[var(--if-layout-control-gap)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
  },
  rail: {
    className: "mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col",
  },
} as const
