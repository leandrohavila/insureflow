"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  formatCurrency,
  pipelineStages,
  stageLabelMap,
  type CrmStageId,
} from "@/lib/crm-mock"

export { formatCurrency, pipelineStages, stageLabelMap, type CrmStageId }

export type CrmDealStatus = "open" | "won" | "lost" | "archived"

export type CrmDeal = {
  id: string
  tenantId: string
  title: string
  company: string
  value: number
  stage: CrmStageId
  status: CrmDealStatus
  assignedTo?: string | null
  email?: string
  createdAt: string
  updatedAt: string
  contact: string
  owner: string
  ownerInitials: string
  priority: "alta" | "media" | "baixa"
  product: string
  lastActivity: string
  tags: string[]
}

export type CreateCrmDealInput = {
  title: string
  company: string
  value: number
  stage: CrmStageId
  status: CrmDealStatus
  assignedTo?: string
}

export type UpdateCrmDealInput = Partial<CreateCrmDealInput>

type BackendCrmDeal = {
  id: string
  tenantId: string
  title: string
  company: string
  value: number | string
  stage: CrmStageId
  status: CrmDealStatus
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
}

const DEALS_QUERY_KEY = ["crm", "deals"] as const

function initials(value: string) {
  return (
    value
      .split(/\s+|[._-]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "IF"
  )
}

function normalizeDeal(deal: BackendCrmDeal): CrmDeal {
  const owner = deal.assignedTo?.trim() || "Sem responsável"
  const value = Number(deal.value)
  return {
    ...deal,
    value,
    contact: deal.company,
    owner,
    ownerInitials: initials(owner),
    priority: value >= 50000 ? "alta" : value >= 15000 ? "media" : "baixa",
    product: "Seguro",
    lastActivity: "Agora",
    tags: [deal.status === "won" ? "Ganho" : deal.status === "lost" ? "Perdido" : "Aberto"],
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error ?? data?.message ?? "Erro ao comunicar com o CRM")
  }
  return data as T
}

export async function fetchDeals() {
  const response = await fetch("/api/crm/deals", { cache: "no-store" })
  const deals = await parseResponse<BackendCrmDeal[]>(response)
  return deals.map(normalizeDeal)
}

export async function createDeal(input: CreateCrmDealInput) {
  const response = await fetch("/api/crm/deals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const deal = await parseResponse<BackendCrmDeal>(response)
  return normalizeDeal(deal)
}

export async function updateDeal(id: string, input: UpdateCrmDealInput) {
  const response = await fetch(`/api/crm/deals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const deal = await parseResponse<BackendCrmDeal>(response)
  return normalizeDeal(deal)
}

export async function deleteDeal(id: string) {
  const response = await fetch(`/api/crm/deals/${id}`, {
    method: "DELETE",
  })
  return parseResponse<{ deleted: true; id: string }>(response)
}

export function useCrmDeals() {
  return useQuery({
    queryKey: DEALS_QUERY_KEY,
    queryFn: fetchDeals,
  })
}

export function useCreateCrmDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY })
    },
  })
}

export function useUpdateCrmDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCrmDealInput }) =>
      updateDeal(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY })
    },
  })
}

export function useDeleteCrmDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DEALS_QUERY_KEY })
    },
  })
}
