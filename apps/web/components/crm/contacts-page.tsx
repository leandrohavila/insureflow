"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion, useReducedMotion } from "framer-motion"
import {
  Filter,
  Mail,
  Phone,
  Upload,
} from "lucide-react"

import { ContactSheetV2 } from "@/components/crm/contact-sheet-v2"
import { CrmPageHeader } from "@/components/crm/crm-page-header"
import { RelationshipWorkspaceBoundary } from "@/components/crm/relationship-workspace-boundary"
import { PermissionGate } from "@/components/auth/permission-gate"
import { useCanManage } from "@/components/auth/session-provider"
import {
  CrmRecordTable,
  LifecycleBadge,
  OwnerCell,
  type CrmTableColumn,
} from "@/components/crm/crm-record-table"
import { ErrorState, LoadingState } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  buildReturnToFromCurrentLocation,
  closeEntitySheetNavigation,
} from "@/lib/crm/entity-sheet-navigation"
import { formatLastInteraction } from "@/lib/crm/last-interaction"
import { useRelationshipIndexContext } from "@/components/crm/relationship-index-provider"
import {
  filterContacts,
  findContactById,
  type OperationalContact,
} from "@/lib/crm/relationship"
import { openCrmCreateLead } from "@/lib/crm/crm-create-navigation"
import {
  formatPhoneBrMask,
  formatStoredPhone,
} from "@/lib/documents/document"
import { CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL } from "@/lib/crm/crm-layout-classes"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { useFocusReturn } from "@/lib/hooks/use-focus-return"
import { easeOut } from "@/lib/motion"
import { cn } from "@/lib/utils"

const SEARCH_DEBOUNCE_MS = 400

const columns: CrmTableColumn<OperationalContact>[] = [
  {
    key: "name",
    header: "Nome",
    render: (row) => (
      <div>
        <p className="font-medium tracking-[-0.02em]">{row.name}</p>
        <p className="text-xs text-muted-foreground">
          {row.email ?? "Sem e-mail"}
        </p>
      </div>
    ),
  },
  {
    key: "company",
    header: "Empresa",
    hideOnMobile: true,
    render: (row) => (
      <span className="text-sm text-muted-foreground">
        {row.companies[0] ?? "—"}
      </span>
    ),
  },
  {
    key: "phone",
    header: "Telefone / WhatsApp",
    hideOnMobile: true,
    render: (row) => {
      const phone = row.phone
        ? formatPhoneBrMask(formatStoredPhone(row.phone))
        : "—"
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Phone className="size-3 opacity-60" />
          {phone}
        </span>
      )
    },
  },
  {
    key: "lifecycle",
    header: "Estágio",
    render: (row) => <LifecycleBadge label={row.lifecycle} />,
  },
  {
    key: "owner",
    header: "Proprietário",
    className: "text-right",
    render: (row) => (
      <OwnerCell initials={row.ownerInitials} name={row.owner} />
    ),
  },
  {
    key: "activity",
    header: "Última interação",
    hideOnMobile: true,
    className: "text-right text-muted-foreground",
    render: (row) => (
      <span className="text-xs">
        {formatLastInteraction(row.lastInteractionAt)}
      </span>
    ),
  },
]

export function ContactsPage() {
  const reduce = useReducedMotion()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const canManageCrm = useCanManage("crm:view")
  const [searchInput, setSearchInput] = useState("")
  const search = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  )
  const { captureFocus, restoreFocus } = useFocusReturn()
  const relationship = useRelationshipIndexContext()

  const syncContactParam = useCallback(
    (contactId: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (contactId) {
        params.set("contact", contactId)
        params.set("sheet", "v2")
      } else {
        params.delete("contact")
      }
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const contactId = searchParams.get("contact")
    setSelectedContactId(contactId)
  }, [searchParams])

  const contacts = useMemo(
    () => filterContacts(relationship.index, search),
    [relationship.index, search],
  )

  const selectedContact = findContactById(
    relationship.index,
    selectedContactId,
  )

  const returnTo = buildReturnToFromCurrentLocation(pathname, searchParams, {
    excludeParams: ["contact", "sheet", "returnTo", "from"],
  })

  const handleContactSelect = useCallback(
    (contact: OperationalContact) => {
      captureFocus()
      setSelectedContactId(contact.id)
      syncContactParam(contact.id)
    },
    [captureFocus, syncContactParam],
  )

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12, ease: easeOut }}
      className={cn(CRM_PAGE_SHELL, CRM_PAGE_SHELL_SCROLL, "gap-8")}
    >
      <CrmPageHeader
        badge="Identidade operacional"
        title="Contatos"
        description="Workspace V2 — identidade consolidada a partir de leads, negócios e clientes."
        primaryAction={
          canManageCrm
            ? {
                label: "Novo contato",
                onClick: () => openCrmCreateLead(router),
              }
            : undefined
        }
      >
        <PermissionGate permission="crm:manage">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="size-3.5" strokeWidth={1.5} />
            Importar
          </Button>
        </PermissionGate>
      </CrmPageHeader>

      <motion.div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar por nome, telefone, e-mail, documento ou empresa…"
            className="h-10 rounded-full border-white/[0.08] bg-white/[0.04] pl-10"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <PermissionGate permission="crm:manage">
          <Button variant="outline" size="sm" className="gap-2">
            <Mail className="size-3.5" />
            Campanha
          </Button>
        </PermissionGate>
      </motion.div>

      {relationship.isLoading ? (
        <LoadingState label="Consolidando identidades operacionais…" />
      ) : relationship.isError ? (
        <ErrorState
          title="Não foi possível carregar contatos."
          description="Erro ao consolidar relacionamentos do CRM."
          onRetry={() => relationship.refetch()}
        />
      ) : (
        <RelationshipWorkspaceBoundary
          title="Não foi possível exibir contatos."
          description="Erro ao consolidar relacionamentos do CRM."
        >
          <CrmRecordTable
            data={contacts}
            columns={columns}
            getRowId={(row) => row.id}
            onRowClick={handleContactSelect}
            title="Todos os contatos"
            subtitle={`${contacts.length} identidade(s) operacional(is) deduplicada(s)`}
          />
        </RelationshipWorkspaceBoundary>
      )}

      <ContactSheetV2
        contact={selectedContact}
        open={selectedContactId !== null && selectedContact !== null}
        returnTo={returnTo}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedContactId(null)
            closeEntitySheetNavigation({
              router,
              pathname,
              searchParams,
              entityType: "contact",
            })
            restoreFocus()
          }
        }}
      />
    </motion.div>
  )
}
