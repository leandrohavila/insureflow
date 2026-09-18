"use client"

import { useEffect, useState } from "react"

import { FormField } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useCommunicationProvider,
  useConnectEvolution,
  useDisconnectEvolution,
  useGenerateEvolutionQr,
  useReconnectEvolution,
  useUpdateCommunicationProvider,
} from "@/lib/data-access/modules/communications"
import type { EvolutionConnectionStatus } from "@/lib/data-access/modules/communications"
import { getErrorMessage } from "@/lib/data-access"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<EvolutionConnectionStatus, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando",
  connected: "Conectado",
  qr: "Aguardando QR Code",
}

function formatWhen(value?: string | null) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function WhatsAppBusinessSettings() {
  const provider = useCommunicationProvider()
  const save = useUpdateCommunicationProvider()
  const connect = useConnectEvolution()
  const reconnect = useReconnectEvolution()
  const disconnect = useDisconnectEvolution()
  const qr = useGenerateEvolutionQr()

  const evolution = provider.data?.evolution
  const [instanceName, setInstanceName] = useState("")
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [qrBase64, setQrBase64] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!evolution) return
    setInstanceName(evolution.instanceName)
    setApiUrl(evolution.apiUrl)
  }, [evolution])

  const busy =
    save.isPending ||
    connect.isPending ||
    reconnect.isPending ||
    disconnect.isPending ||
    qr.isPending

  const status = evolution?.connectionStatus ?? "disconnected"

  async function persistCredentials() {
    return save.mutateAsync({
      kind: "EVOLUTION",
      enabled: true,
      instanceName: instanceName.trim(),
      apiUrl: apiUrl.trim(),
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
    })
  }

  async function handleConnect() {
    setFeedback(null)
    await persistCredentials()
    const result = await connect.mutateAsync()
    setQrBase64(result.qr?.base64 ?? null)
    setFeedback(result.message ?? (result.ok ? "Instância conectada" : null))
  }

  async function handleReconnect() {
    setFeedback(null)
    await persistCredentials()
    const result = await reconnect.mutateAsync()
    setQrBase64(result.qr?.base64 ?? null)
    setFeedback(result.message ?? "Reconexão iniciada")
  }

  async function handleDisconnect() {
    setFeedback(null)
    const result = await disconnect.mutateAsync()
    setQrBase64(null)
    setFeedback(result.message ?? "Instância desconectada")
  }

  async function handleQr() {
    setFeedback(null)
    await persistCredentials()
    const result = await qr.mutateAsync()
    setQrBase64(result.base64)
    setFeedback(result.errorMessage ?? "QR Code gerado")
  }

  return (
    <section className="space-y-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div>
        <h2 className="text-sm font-medium">WhatsApp Business</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Conecte a Evolution API. Reativação, follow-ups, renovação e
          cross-sell passam a usar o WhatsApp real sem mudar os fluxos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome da instância" htmlFor="evolution-instance">
          <Input
            id="evolution-instance"
            value={instanceName}
            onChange={(event) => setInstanceName(event.target.value)}
            placeholder="insureflow-prod"
          />
        </FormField>
        <FormField label="URL Evolution" htmlFor="evolution-url">
          <Input
            id="evolution-url"
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            placeholder="https://evolution.seudominio.com"
          />
        </FormField>
        <FormField
          label="API Key"
          htmlFor="evolution-key"
          helpText={
            evolution?.hasApiKey
              ? `Chave salva: ${evolution.apiKeyMasked}`
              : "Obrigatória para conectar"
          }
        >
          <Input
            id="evolution-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={evolution?.hasApiKey ? "•••• manter atual" : "apikey"}
          />
        </FormField>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Status da conexão
          </p>
          <p
            className={cn(
              "text-sm font-medium",
              status === "connected" && "text-emerald-400",
              status === "qr" && "text-amber-300",
              status === "disconnected" && "text-muted-foreground",
            )}
          >
            {STATUS_LABEL[status]}
          </p>
          <p className="text-xs text-muted-foreground">
            Última sincronização: {formatWhen(evolution?.lastSyncedAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void handleConnect()}>
          Conectar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void handleReconnect()}
        >
          Reconectar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void handleDisconnect()}
        >
          Desconectar
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void handleQr()}
        >
          Gerar QR Code
        </Button>
      </div>

      {qrBase64 ? (
        <div className="rounded-lg border border-white/[0.08] bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrBase64}
            alt="QR Code WhatsApp Evolution"
            className="mx-auto h-56 w-56"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Abra o WhatsApp no celular e leia o QR Code.
          </p>
        </div>
      ) : null}

      {feedback ? (
        <p className="text-xs text-muted-foreground">{feedback}</p>
      ) : null}
      {save.error || connect.error || reconnect.error || disconnect.error || qr.error ? (
        <p className="text-xs text-destructive">
          {getErrorMessage(
            save.error ??
              connect.error ??
              reconnect.error ??
              disconnect.error ??
              qr.error,
          )}
        </p>
      ) : null}
    </section>
  )
}
