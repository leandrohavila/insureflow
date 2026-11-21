"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, X } from "lucide-react"

import { CrmFilterChip, CrmFilterGroup } from "@/components/crm/crm-controls"
import { Input } from "@/components/ui/input"
import { useCrmDeals } from "@/lib/data-access/modules/crm"
import { useCustomers } from "@/lib/data-access/modules/customers"
import { useLeads } from "@/lib/data-access/modules/leads"
import { fetchPoliciesForLink } from "@/lib/data-access/modules/policies/api"
import { getErrorMessage } from "@/lib/data-access"
import {
  type ActivityLinkKind,
  type ActivityLinkValue,
} from "@/lib/crm/activity-link"
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const KINDS: {
  id: ActivityLinkKind
  label: string
  color: string
  surface: string
}[] = [
  { id: "lead", label: "Lead", color: "#2878C8", surface: "#E7F0FA" },
  { id: "deal", label: "Negócio", color: "#10294B", surface: "#F5F0E7" },
  { id: "customer", label: "Cliente", color: "#315B8A", surface: "#E9EFF8" },
  { id: "policy", label: "Apólice", color: "#A87528", surface: "#F8EDDB" },
]

type ActivityLinkFieldProps = {
  value: ActivityLinkValue | null
  onChange: (value: ActivityLinkValue | null) => void
  disabled?: boolean
  /** Drawer da Agenda. O modal dos demais módulos mantém a lista atual. */
  variant?: "default" | "drawer"
  /** Vínculo já definido pelo Lead ou pelo negócio. Não abre busca nem remoção. */
  locked?: boolean
}

function digits(value: string) {
  return value.replace(/\D/g, "")
}

function matchesQuery(query: string, parts: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const qDigits = digits(q)
  return parts.some((part) => {
    if (!part) return false
    if (part.toLowerCase().includes(q)) return true
    return qDigits.length >= 3 && digits(part).includes(qDigits)
  })
}

export function ActivityLinkField({
  value,
  onChange,
  disabled,
  variant = "default",
  locked = false,
}: ActivityLinkFieldProps) {
  const [kind, setKind] = useState<ActivityLinkKind>(value?.kind ?? "lead")
  const [query, setQuery] = useState("")
  const [replacing, setReplacing] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounced = useDebouncedValue(query, 300)
  const activeKind = value?.kind ?? kind

  const leadsQuery = useLeads(
    { search: debounced.trim(), limit: 8 },
    { enabled: activeKind === "lead" },
  )
  const customersQuery = useCustomers(
    { search: debounced.trim(), limit: 8 },
    { enabled: activeKind === "customer" },
  )
  const dealsQuery = useCrmDeals({ enabled: activeKind === "deal" })
  const policiesQuery = useQuery({
    queryKey: ["policies", "activity-link"],
    queryFn: () => fetchPoliciesForLink(100),
    enabled: activeKind === "policy",
  })

  const options = useMemo(() => {
    if (activeKind === "lead") {
      return (leadsQuery.data?.data ?? []).map((lead) => ({
        id: lead.id,
        title: lead.name,
        detail: [lead.phone, lead.document, lead.company].filter(Boolean).join(" · "),
      }))
    }
    if (activeKind === "customer") {
      return (customersQuery.data?.data ?? []).map((customer) => ({
        id: customer.id,
        title: customer.name,
        detail: [customer.phone, customer.document, customer.companyName]
          .filter(Boolean)
          .join(" · "),
      }))
    }
    if (activeKind === "deal") {
      return (dealsQuery.data ?? [])
        .filter((deal) =>
          matchesQuery(debounced, [
            deal.title,
            deal.company,
            deal.contact,
            deal.email,
            deal.commercialContext?.phone,
            deal.convertedLead?.name,
            deal.convertedLead?.phone,
          ]),
        )
        .slice(0, 8)
        .map((deal) => ({
          id: deal.id,
          title: deal.title,
          detail: [deal.company, deal.commercialContext?.phone, deal.contact]
            .filter(Boolean)
            .join(" · "),
        }))
    }
    return (policiesQuery.data?.data ?? [])
      .filter((policy) =>
        matchesQuery(debounced, [
          policy.policyNumber,
          policy.insurer,
          policy.customer?.name,
          policy.customer?.document,
        ]),
      )
      .slice(0, 8)
      .map((policy) => ({
        id: policy.id,
        title: policy.policyNumber,
        detail: [policy.insurer, policy.customer?.name, policy.customer?.document]
          .filter(Boolean)
          .join(" · "),
      }))
  }, [
    activeKind,
    customersQuery.data?.data,
    dealsQuery.data,
    debounced,
    leadsQuery.data?.data,
    policiesQuery.data?.data,
  ])

  const loading =
    (activeKind === "lead" && leadsQuery.isFetching) ||
    (activeKind === "customer" && customersQuery.isFetching) ||
    (activeKind === "deal" && dealsQuery.isFetching) ||
    (activeKind === "policy" && policiesQuery.isFetching)
  const error =
    (activeKind === "lead" && leadsQuery.error) ||
    (activeKind === "customer" && customersQuery.error) ||
    (activeKind === "deal" && dealsQuery.error) ||
    (activeKind === "policy" && policiesQuery.error)

  function selectKind(next: ActivityLinkKind) {
    setKind(next)
    setQuery("")
    setActiveIndex(0)
    if (value && value.kind !== next) onChange(null)
  }

  function choose(option: { id: string; title: string; detail: string }) {
    onChange({
      kind: activeKind,
      id: option.id,
      title: option.title,
      detail: option.detail || undefined,
    })
    setQuery("")
    setReplacing(false)
    setActiveIndex(0)
  }

  useEffect(() => {
    setActiveIndex(0)
  }, [debounced, activeKind, options.length])

  useEffect(() => {
    if (!value) setReplacing(false)
  }, [value])

  useEffect(() => {
    if (variant === "drawer" && replacing) searchRef.current?.focus()
  }, [replacing, variant])

  const kindMeta = KINDS.find((item) => item.id === activeKind) ?? {
    id: "lead" as const,
    label: "Lead",
    color: "#2878C8",
    surface: "#E7F0FA",
  }
  const showResults = variant === "drawer" && (!value || replacing)

  useEffect(() => {
    if (!showResults) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, showResults])

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (options.length === 0) return
      setActiveIndex((index) => (index + 1) % options.length)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (options.length === 0) return
      setActiveIndex((index) => (index - 1 + options.length) % options.length)
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) choose(option)
      return
    }
    if (event.key === "Escape" && replacing) {
      event.preventDefault()
      event.stopPropagation()
      setReplacing(false)
      setQuery("")
    }
  }

  if (locked && value) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#5c6578]">
          Vínculo associado
        </span>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#10294B] bg-[#F6F1E8] px-2.5! py-2!">
          <span
            className="inline-flex shrink-0 items-center rounded-md px-1.5! py-0.5! text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase"
            style={{ color: kindMeta.color, background: kindMeta.surface }}
            title={kindMeta.label}
          >
            {kindMeta.label}
          </span>
          <div className="min-w-[8rem] flex-1">
            <p className="truncate text-sm font-semibold text-[#10294B]" title={value.title}>
              {value.title}
            </p>
            {value.detail ? (
              <p className="truncate text-[11px] text-[#5c6578]" title={value.detail}>
                {value.detail}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  if (variant === "drawer") {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#5c6578]">
          Vincular a <span className="text-destructive">*</span>
        </span>
        <CrmFilterGroup label="Tipo de vínculo">
          {KINDS.map((item) => {
            const selected = activeKind === item.id
            return (
              <CrmFilterChip
                key={item.id}
                pressed={selected}
                disabled={disabled}
                onClick={() => selectKind(item.id)}
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: selected ? "currentColor" : item.color }}
                  aria-hidden
                />
                {item.label}
              </CrmFilterChip>
            )
          })}
        </CrmFilterGroup>

        {value && !replacing ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#10294B] bg-[#F6F1E8] px-2.5! py-2!">
            <span
              className="inline-flex shrink-0 items-center rounded-md px-1.5! py-0.5! text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase"
              style={{ color: kindMeta.color, background: kindMeta.surface }}
              title={kindMeta.label}
            >
              {kindMeta.label}
            </span>
            <div className="min-w-[8rem] flex-1">
              <p className="truncate text-sm font-semibold text-[#10294B]" title={value.title}>
                {value.title}
              </p>
              {value.detail ? (
                <p className="truncate text-[11px] text-[#5c6578]" title={value.detail}>
                  {value.detail}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-[#10294B] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#10294B]/30 focus-visible:outline-none"
              disabled={disabled}
              onClick={() => setReplacing(true)}
            >
              Alterar
            </button>
            <button
              type="button"
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[#10294B] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#10294B]/30 focus-visible:outline-none"
              aria-label="Remover vínculo"
              disabled={disabled}
              onClick={() => onChange(null)}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : null}

        {showResults ? (
          <div className="flex flex-col gap-1.5">
            {value && replacing ? (
              <div className="flex items-center justify-between gap-2 text-xs text-[#10294B]/70">
                <span className="min-w-0 truncate">
                  Vínculo atual: <span className="font-semibold text-[#10294B]">{value.title}</span>
                </span>
                <button
                  type="button"
                  className="shrink-0 font-semibold text-[#10294B] underline-offset-2 hover:underline"
                  onClick={() => {
                    setReplacing(false)
                    setQuery("")
                  }}
                >
                  Manter
                </button>
              </div>
            ) : null}
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#5c6578]"
                aria-hidden
              />
              <Input
                ref={searchRef}
                value={query}
                disabled={disabled}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Buscar por nome, telefone ou documento"
                className="h-9! border-[#d6cfc4]! bg-white! pr-3! pl-9! text-sm! text-[#10294B]! shadow-none! [color-scheme:light] placeholder:text-[#5c6578]! focus-visible:border-[#10294B]! focus-visible:ring-2! focus-visible:ring-[#10294B]/20!"
                aria-label="Pesquisar vínculo"
                role="combobox"
                aria-expanded={showResults}
                aria-controls="agenda-activity-link-list"
                aria-activedescendant={
                  options[activeIndex]
                    ? `agenda-activity-link-opt-${options[activeIndex].id}`
                    : undefined
                }
                autoComplete="off"
              />
            </div>
            <div
              ref={listRef}
              id="agenda-activity-link-list"
              role="listbox"
              aria-label={`Resultados de ${kindMeta.label}`}
              className="max-h-40 overflow-x-hidden overflow-y-auto rounded-lg border border-[#d6cfc4] bg-white p-1! [scrollbar-width:thin]"
            >
              {loading && options.length === 0 ? (
                <p className="px-2! py-2! text-sm text-[#5c6578]">Buscando…</p>
              ) : null}
              {error ? (
                <p className="px-2! py-2! text-sm text-destructive" role="alert">
                  {getErrorMessage(error, "Não foi possível buscar os registros.")}
                </p>
              ) : null}
              {!loading && !error && options.length === 0 ? (
                <p className="px-2! py-2! text-sm text-[#5c6578]">
                  Nenhum registro encontrado.
                </p>
              ) : null}
              {!error
                ? options.map((option, index) => {
                    const active = index === activeIndex
                    return (
                      <button
                        key={option.id}
                        id={`agenda-activity-link-opt-${option.id}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-index={index}
                        tabIndex={-1}
                        disabled={disabled}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-2 rounded-md border px-2! py-1.5! text-left",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10294B]/30",
                          active
                            ? "border-[#10294B] bg-[#F6F1E8]"
                            : "border-transparent hover:bg-[#F6F1E8]",
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => choose(option)}
                      >
                        <span
                          className="inline-flex shrink-0 items-center rounded px-1.5! py-0.5! text-[10px] leading-none font-semibold tracking-wide whitespace-nowrap uppercase"
                          style={{ color: kindMeta.color, background: kindMeta.surface }}
                          title={kindMeta.label}
                        >
                          {kindMeta.label}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#10294B]" title={option.title}>
                            {option.title}
                          </span>
                          {option.detail ? (
                            <span className="block truncate text-[11px] leading-4 text-[#5c6578]">
                              {option.detail}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    )
                  })
                : null}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <span className="crm-text-micro tracking-wide text-foreground/72">
        Vincular a <span className="text-destructive">*</span>
      </span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo de vínculo">
        {KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            aria-pressed={activeKind === item.id}
            className={cn(
              "inline-flex h-8 items-center rounded-full border px-3 text-xs font-semibold",
              activeKind === item.id
                ? "border-[var(--avila-navy-900)] bg-[var(--avila-navy-900)] text-[var(--avila-ivory)]"
                : "border-[#e4ddd2] bg-white text-[var(--avila-navy-900)]",
            )}
            onClick={() => selectKind(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {value ? (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[#e4ddd2] bg-[#F5F0E7] px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--avila-navy-900)]">
              {value.title}
            </p>
            <p className="text-xs text-[var(--avila-navy-900)]/70">
              {KINDS.find((item) => item.id === value.kind)?.label}
              {value.detail ? ` · ${value.detail}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--avila-navy-900)]"
            aria-label="Remover vínculo"
            disabled={disabled}
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, telefone ou documento"
              className="h-9 pl-9"
              aria-label="Pesquisar vínculo"
            />
          </div>
          <div className="max-h-44 overflow-y-auto rounded-lg border border-[#e4ddd2] bg-white">
            {loading ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">Buscando…</p>
            ) : null}
            {error ? (
              <p className="px-3 py-2 text-sm text-destructive">
                {getErrorMessage(error, "Não foi possível buscar os registros.")}
              </p>
            ) : null}
            {!loading && !error && options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum registro encontrado.
              </p>
            ) : null}
            {!error
              ? options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    className="flex w-full flex-col items-start gap-0.5 border-b border-[#efeae2] px-3 py-2 text-left last:border-b-0 hover:bg-[#F5F0E7]"
                    onClick={() =>
                      onChange({
                        kind: activeKind,
                        id: option.id,
                        title: option.title,
                        detail: option.detail || undefined,
                      })
                    }
                  >
                    <span className="text-sm font-semibold text-[var(--avila-navy-900)]">
                      {option.title}
                    </span>
                    {option.detail ? (
                      <span className="text-xs text-[var(--avila-navy-900)]/70">
                        {option.detail}
                      </span>
                    ) : null}
                  </button>
                ))
              : null}
          </div>
        </>
      )}
    </div>
  )
}
