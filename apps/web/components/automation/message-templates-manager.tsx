"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormSelect } from "@/components/design-system"
import {
  MESSAGE_CHANNEL_LABELS,
  MESSAGE_CHANNELS,
  MESSAGE_TEMPLATE_KIND_LABELS,
  type MessageChannel,
} from "@/lib/business-units/constants"
import {
  useCreateMessageTemplate,
  useDeleteMessageTemplate,
  useMessageTemplates,
  useUpdateMessageTemplate,
} from "@/lib/data-access/modules/automation"

const DEFAULT_CONTENT =
  "Olá {{nome}}.\n\nHá algum tempo conversamos sobre {{interesse}}.\nGostaria de verificar se ainda possui interesse.\nPosso ajudar?"

export function MessageTemplatesManager() {
  const { data = [] } = useMessageTemplates()
  const createTemplate = useCreateMessageTemplate()
  const updateTemplate = useUpdateMessageTemplate()
  const deleteTemplate = useDeleteMessageTemplate()
  const [name, setName] = useState("")
  const [channel, setChannel] = useState<MessageChannel>("WHATSAPP")
  const [kind, setKind] = useState("FOLLOW_UP")
  const [content, setContent] = useState(DEFAULT_CONTENT)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !content.trim()) return
    await createTemplate.mutateAsync({
      name: name.trim(),
      channel,
      content: content.trim(),
      kind,
    })
    setName("")
    setContent(DEFAULT_CONTENT)
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do template"
          />
          <FormSelect
            value={channel}
            onChange={(event) =>
              setChannel(event.target.value as MessageChannel)
            }
            options={MESSAGE_CHANNELS.map((item) => ({
              value: item,
              label: MESSAGE_CHANNEL_LABELS[item],
            }))}
          />
          <FormSelect
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            options={[
              { value: "FOLLOW_UP", label: "Follow-up" },
              { value: "REACTIVATION", label: "Reativação" },
              { value: "RENEWAL", label: "Renovação" },
              { value: "CROSS_SELL", label: "Cross-sell" },
            ]}
          />
        </div>
        <textarea
          className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Variáveis: {`{{nome}} {{empresa}} {{produto}} {{corretor}} {{vencimento}}`}
        </p>
        <Button type="submit" disabled={createTemplate.isPending}>
          Salvar template
        </Button>
      </form>

      <div className="space-y-3">
        {data.map((template) => (
          <article
            key={template.id}
            className="rounded-lg border border-white/[0.06] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {MESSAGE_CHANNEL_LABELS[template.channel]} ·{" "}
                  {MESSAGE_TEMPLATE_KIND_LABELS[template.kind] ?? template.kind}{" "}
                  · {template.active ? "ativo" : "inativo"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateTemplate.mutate({
                      id: template.id,
                      input: { active: !template.active },
                    })
                  }
                >
                  {template.active ? "Desativar" : "Ativar"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTemplate.mutate(template.id)}
                >
                  Excluir
                </Button>
              </div>
            </div>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {template.content}
            </pre>
          </article>
        ))}
      </div>
    </div>
  )
}
