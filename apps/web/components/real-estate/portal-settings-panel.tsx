"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react"
import { AlertCircle, CheckCircle2, ExternalLink, Pencil } from "lucide-react"

import { usePermission } from "@/components/auth/session-provider"
import { AppCard, FormLayout, Section, Stack } from "@/components/design-system"
import { PortalLivePreview } from "@/components/real-estate/portal-live-preview"
import { ActionToast } from "@/components/shared/action-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  EMPTY_PORTAL_CONFIG,
  PORTAL_DIFFERENTIAL_LIMIT,
  PORTAL_TEXT_LIMITS,
  assessDifferentials,
  assessImageField,
  assessTextField,
  characterCounter,
  longestDifferentialLength,
  messageFromPayload,
  portalConfigFromApi,
  portalConfigToPayload,
  portalFormIsValid,
  resolvePortalPublicUrl,
  type PortalConfigForm,
  type PortalImageKey,
  type PortalTextKey,
} from "@/lib/real-estate/portal-config-form"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"
import { cn } from "@/lib/utils"

type Banner = {
  id: string
  title: string
  subtitle?: string | null
  image: string
  link?: string | null
  active: boolean
  order: number
}

type Feedback = { tone: "success" | "error"; message: string }

type TextFieldConfig = {
  key: PortalTextKey
  label: string
  placeholder?: string
  helpText?: string
  type?: string
}

const IDENTITY_FIELDS: TextFieldConfig[] = [
  { key: "companyName", label: "Nome da imobiliária" },
  { key: "creci", label: "CRECI" },
  {
    key: "portalUrl",
    label: "Portal URL",
    placeholder: "https://imoveis.suaimobiliaria.com.br",
    helpText: "Domínio público do portal. Vazio usa o domínio padrão do ambiente.",
    type: "url",
  },
  {
    key: "publicSlug",
    label: "Slug público",
    placeholder: "avila-imoveis",
    helpText: "Somente letras minúsculas, números e hífen.",
  },
]

const HERO_FIELDS: TextFieldConfig[] = [
  { key: "heroTitle", label: "Título Hero" },
  { key: "heroSubtitle", label: "Subtítulo Hero" },
]

const CONTACT_FIELDS: TextFieldConfig[] = [
  { key: "phone", label: "Telefone", type: "tel" },
  { key: "whatsapp", label: "WhatsApp", type: "tel" },
  { key: "email", label: "E-mail", type: "email" },
  { key: "address", label: "Endereço" },
]

const SOCIAL_FIELDS: TextFieldConfig[] = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
]

const READ_FIELDS: { key: keyof PortalConfigForm; label: string }[] = [
  { key: "companyName", label: "Nome da imobiliária" },
  { key: "heroTitle", label: "Título Hero" },
  { key: "heroSubtitle", label: "Subtítulo Hero" },
  { key: "phone", label: "Telefone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "address", label: "Endereço" },
  { key: "creci", label: "CRECI" },
  { key: "aboutTitle", label: "Título institucional" },
  { key: "portalUrl", label: "Portal URL" },
  { key: "publicSlug", label: "Slug público" },
]

const IMAGE_FIELDS: { key: PortalImageKey; label: string }[] = [
  { key: "heroImage", label: "Imagem Hero" },
  { key: "logoUrl", label: "Logo" },
  { key: "aboutImage", label: "Imagem institucional" },
]

async function uploadPortalImage(
  businessUnitId: string,
  file: File,
  previousUrl?: string,
) {
  const body = new FormData()
  body.set("file", file)
  body.set("businessUnitId", businessUnitId)
  if (previousUrl) body.set("previousUrl", previousUrl)
  const response = await fetch("/api/portal-media", { method: "POST", body })
  const payload = (await response.json().catch(() => null)) as
    | { url?: string; message?: string | string[] }
    | null
  if (!response.ok || !payload?.url) {
    throw new Error(messageFromPayload(payload, "Não foi possível enviar a imagem."))
  }
  return payload.url
}

function ImagePreview({ url, alt }: { url: string; alt: string }) {
  if (!url) return null
  return (
    <div className="overflow-hidden rounded-md border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-28 w-full object-contain" />
    </div>
  )
}

export function PortalSettingsPanel({
  portalOrigin,
  unitSlug,
  onSavedChange,
}: {
  portalOrigin: string
  unitSlug: string
  onSavedChange?: (config: PortalConfigForm) => void
}) {
  const businessUnitId = useRealEstateBusinessUnitId()
  const canManage = usePermission("properties:manage")
  const [saved, setSaved] = useState<PortalConfigForm>(EMPTY_PORTAL_CONFIG)
  const [draft, setDraft] = useState<PortalConfigForm>(EMPTY_PORTAL_CONFIG)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: "success" | "danger" } | null>(null)
  const [banners, setBanners] = useState<Banner[]>([])
  const [banner, setBanner] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    order: "0",
  })
  const [bannerStatus, setBannerStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const formIsValid = useMemo(() => portalFormIsValid(draft), [draft])

  useEffect(() => {
    onSavedChange?.(saved)
  }, [saved, onSavedChange])

  const loadConfig = useCallback(async (unitId: string) => {
    const query = `?businessUnitId=${encodeURIComponent(unitId)}`
    const response = await fetch(`/api/portal-config${query}`)
    if (!response.ok) return false
    const config = portalConfigFromApi(await response.json())
    setSaved(config)
    setDraft(config)
    return true
  }, [])

  useEffect(() => {
    if (!businessUnitId) return
    const query = `?businessUnitId=${encodeURIComponent(businessUnitId)}`
    setLoading(true)
    void loadConfig(businessUnitId)
      .catch(() => false)
      .then((loaded) => {
        if (!loaded) {
          setFeedback({ tone: "error", message: "Não foi possível carregar a configuração do portal." })
        }
      })
      .finally(() => setLoading(false))
    void fetch(`/api/portal-banners${query}`)
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data: Banner[]) => setBanners(Array.isArray(data) ? data : []))
  }, [businessUnitId, loadConfig])

  const savedPublicUrl = useMemo(
    () => resolvePortalPublicUrl(saved, portalOrigin, unitSlug),
    [saved, portalOrigin, unitSlug],
  )
  const draftPublicUrl = useMemo(
    () => resolvePortalPublicUrl(draft, portalOrigin, unitSlug),
    [draft, portalOrigin, unitSlug],
  )
  const dirty = useMemo(
    () => JSON.stringify(saved) !== JSON.stringify(draft),
    [saved, draft],
  )

  function update(key: keyof PortalConfigForm, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function startEditing() {
    setDraft(saved)
    setFeedback(null)
    setEditing(true)
  }

  function cancelEditing() {
    setDraft(saved)
    setFeedback(null)
    setEditing(false)
  }

  function openPortal() {
    window.open(savedPublicUrl, "_blank", "noopener,noreferrer")
  }

  async function saveConfig(event: FormEvent) {
    event.preventDefault()
    if (!businessUnitId) return
    if (!portalFormIsValid(draft)) {
      setFeedback({ tone: "error", message: "Revise os campos destacados antes de salvar." })
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      const response = await fetch("/api/portal-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portalConfigToPayload(draft, businessUnitId)),
      })
      const payload: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        setToast({
          message: messageFromPayload(
            payload,
            "Não foi possível salvar. Verifique os campos destacados.",
          ),
          tone: "danger",
        })
        return
      }
      const reloaded = await loadConfig(businessUnitId).catch(() => false)
      if (!reloaded) {
        const config = portalConfigFromApi(payload)
        setSaved(config)
        setDraft(config)
      }
      setEditing(false)
      setToast({ message: "Configuração do portal salva com sucesso.", tone: "success" })
    } catch {
      setToast({ message: "Falha de conexão ao salvar o portal.", tone: "danger" })
    } finally {
      setSaving(false)
    }
  }

  async function onConfigImage(key: PortalImageKey, file: File | undefined) {
    if (!businessUnitId || !file) return
    setUploading(key)
    setFeedback(null)
    try {
      const previous = draft[key] !== saved[key] ? draft[key] : undefined
      const url = await uploadPortalImage(businessUnitId, file, previous)
      update(key, url)
      setFeedback({ tone: "success", message: "Imagem enviada. Salve o portal para publicar." })
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Não foi possível enviar a imagem.",
      })
    } finally {
      setUploading(null)
    }
  }

  async function addBanner(event: FormEvent) {
    event.preventDefault()
    if (!businessUnitId || !banner.title.trim() || !banner.image) return
    const response = await fetch("/api/portal-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessUnitId,
        title: banner.title.trim(),
        subtitle: banner.subtitle.trim() || undefined,
        image: banner.image,
        link: banner.link.trim() || undefined,
        order: Number(banner.order) || 0,
        active: true,
      }),
    })
    if (!response.ok) {
      setBannerStatus("Não foi possível criar o banner.")
      return
    }
    const created = (await response.json()) as Banner
    setBanners((current) => [...current, created].sort((a, b) => a.order - b.order))
    setBanner({ title: "", subtitle: "", image: "", link: "", order: "0" })
    setBannerStatus(null)
  }

  async function onBannerFile(file: File | undefined) {
    if (!businessUnitId || !file) return
    setUploading("banner")
    setBannerStatus(null)
    try {
      const url = await uploadPortalImage(businessUnitId, file, banner.image)
      setBanner((current) => ({ ...current, image: url }))
    } catch (error) {
      setBannerStatus(error instanceof Error ? error.message : "Não foi possível enviar a imagem.")
    } finally {
      setUploading(null)
    }
  }

  async function replaceBanner(item: Banner, file: File | undefined) {
    if (!businessUnitId || !file) return
    setUploading(item.id)
    setBannerStatus(null)
    try {
      const url = await uploadPortalImage(businessUnitId, file, item.image)
      const response = await fetch(`/api/portal-banners/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      })
      if (!response.ok) {
        setBannerStatus("Não foi possível substituir a imagem do banner.")
        return
      }
      const updated = (await response.json()) as Banner
      setBanners((current) => current.map((entry) => (entry.id === item.id ? updated : entry)))
    } catch (error) {
      setBannerStatus(error instanceof Error ? error.message : "Não foi possível substituir a imagem.")
    } finally {
      setUploading(null)
    }
  }

  async function removeBanner(id: string) {
    const response = await fetch(`/api/portal-banners/${id}`, { method: "DELETE" })
    if (response.ok) setBanners((current) => current.filter((item) => item.id !== id))
  }

  function renderTextFields(fields: TextFieldConfig[]) {
    return fields.map((field) => (
      <TextField
        key={field.key}
        id={`portal-${field.key}`}
        label={field.label}
        type={field.type}
        placeholder={field.placeholder}
        helpText={field.helpText}
        value={draft[field.key]}
        max={PORTAL_TEXT_LIMITS[field.key]}
        feedback={assessTextField(field.key, draft[field.key])}
        onChange={(value) =>
          update(field.key, field.key === "publicSlug" ? value.toLowerCase() : value)
        }
      />
    ))
  }

  function renderImageField(key: PortalImageKey, label: string) {
    const imageFeedback = assessImageField(draft[key])
    return (
      <div className="space-y-1">
        <PortalImageField
          label={label}
          url={draft[key]}
          busy={uploading === key}
          invalid={Boolean(imageFeedback.error)}
          onSelect={(file) => void onConfigImage(key, file)}
          onRemove={() => update(key, "")}
        />
        {imageFeedback.error ? <FieldMessage>{imageFeedback.error}</FieldMessage> : null}
      </div>
    )
  }

  const saveDisabled = saving || !businessUnitId || uploading !== null || !formIsValid

  return (
    <Section>
      <Stack gap="sm">
        <AppCard padding="compact" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Configuração Portal Comercial</p>
              <p className="text-xs text-muted-foreground">
                {editing
                  ? "Editando — as alterações só ficam públicas após salvar."
                  : "Conteúdo exibido no portal imobiliário público."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={openPortal}>
                <ExternalLink data-icon="inline-start" />
                Abrir Portal
              </Button>
              {canManage && !editing ? (
                <Button type="button" onClick={startEditing} disabled={loading || !businessUnitId}>
                  <Pencil data-icon="inline-start" />
                  Editar Portal
                </Button>
              ) : null}
            </div>
          </div>

          {feedback ? (
            <div
              role={feedback.tone === "error" ? "alert" : "status"}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
                feedback.tone === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {feedback.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              )}
              <span>{feedback.message}</span>
            </div>
          ) : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando configuração…</p>
          ) : editing ? (
            <form
              className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]"
              onSubmit={saveConfig}
              noValidate
            >
              <div className="space-y-6">
                <FormSection title="Identidade e publicação">
                  <FormLayout>{renderTextFields(IDENTITY_FIELDS)}</FormLayout>
                </FormSection>

                <FormSection title="Hero">
                  <FormLayout>
                    {renderTextFields(HERO_FIELDS)}
                    {renderImageField("heroImage", "Imagem Hero")}
                    {renderImageField("logoUrl", "Logo")}
                  </FormLayout>
                </FormSection>

                <FormSection title="Contato">
                  <FormLayout>{renderTextFields(CONTACT_FIELDS)}</FormLayout>
                </FormSection>

                <FormSection title="Redes sociais">
                  <FormLayout>{renderTextFields(SOCIAL_FIELDS)}</FormLayout>
                </FormSection>

                <FormSection title="Institucional">
                  <FormLayout>
                    {renderTextFields([{ key: "aboutTitle", label: "Título institucional" }])}
                    {renderImageField("aboutImage", "Imagem institucional")}
                    <CountedTextarea
                      id="portal-aboutText"
                      className="sm:col-span-2"
                      label="Texto institucional"
                      value={draft.aboutText}
                      max={PORTAL_TEXT_LIMITS.aboutText}
                      feedback={assessTextField("aboutText", draft.aboutText)}
                      onChange={(value) => update("aboutText", value)}
                    />
                    <CountedTextarea
                      id="portal-differentials"
                      className="sm:col-span-2"
                      label="Diferenciais"
                      helpText="Um diferencial por linha."
                      value={draft.differentials}
                      max={PORTAL_DIFFERENTIAL_LIMIT}
                      length={longestDifferentialLength(draft.differentials)}
                      feedback={assessDifferentials(draft.differentials)}
                      onChange={(value) => update("differentials", value)}
                    />
                  </FormLayout>
                </FormSection>

                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button type="submit" disabled={saveDisabled}>
                    {saving ? "Salvando…" : "Salvar"}
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelEditing} disabled={saving}>
                    Cancelar
                  </Button>
                  {dirty ? (
                    <span className="self-center text-xs text-muted-foreground">
                      Alterações não salvas
                    </span>
                  ) : null}
                </div>
              </div>

              <aside className="space-y-2 lg:sticky lg:top-2 lg:self-start">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preview em tempo real
                </p>
                <PortalLivePreview form={draft} publicUrl={draftPublicUrl} />
              </aside>
            </form>
          ) : (
            <PortalConfigReadView config={saved} publicUrl={savedPublicUrl} />
          )}
        </AppCard>

        <AppCard padding="compact" className="space-y-4">
          <p className="text-sm font-medium">Gestão de Banners</p>
          <ul className="space-y-3 text-sm">
            {banners.map((item) => (
              <li key={item.id} className="grid gap-3 rounded-md border border-border p-3 md:grid-cols-[8rem_1fr_auto]">
                <ImagePreview url={item.image} alt={item.title} />
                <div>
                  <p className="font-medium">
                    {item.order}. {item.title}
                  </p>
                  {item.subtitle ? <p className="text-muted-foreground">{item.subtitle}</p> : null}
                </div>
                {canManage ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <FileButton
                      label={uploading === item.id ? "Enviando…" : "Substituir"}
                      disabled={uploading === item.id}
                      onSelect={(file) => void replaceBanner(item, file)}
                    />
                    <Button type="button" variant="outline" onClick={() => removeBanner(item.id)}>
                      Remover
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
            {banners.length === 0 ? <li className="text-muted-foreground">Nenhum banner.</li> : null}
          </ul>
          {canManage ? (
            <form className="grid gap-3 md:grid-cols-2" onSubmit={addBanner}>
              <Input placeholder="Título" value={banner.title} onChange={(event) => setBanner({ ...banner, title: event.target.value })} />
              <Input placeholder="Subtítulo" value={banner.subtitle} onChange={(event) => setBanner({ ...banner, subtitle: event.target.value })} />
              <div className="space-y-2">
                <FileButton
                  label={uploading === "banner" ? "Enviando…" : banner.image ? "Substituir imagem" : "Enviar imagem"}
                  disabled={!businessUnitId || uploading === "banner"}
                  onSelect={(file) => void onBannerFile(file)}
                />
                {banner.image ? (
                  <>
                    <ImagePreview url={banner.image} alt="Prévia do banner" />
                    <Button type="button" variant="outline" onClick={() => setBanner({ ...banner, image: "" })}>
                      Remover imagem
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Envie a imagem do banner. A URL é gerada automaticamente.</p>
                )}
              </div>
              <Input placeholder="Link" value={banner.link} onChange={(event) => setBanner({ ...banner, link: event.target.value })} />
              <Input placeholder="Ordem" value={banner.order} onChange={(event) => setBanner({ ...banner, order: event.target.value })} />
              <Button type="submit" disabled={!businessUnitId || !banner.image}>
                Adicionar banner
              </Button>
            </form>
          ) : null}
          {bannerStatus ? <p className="text-sm text-destructive">{bannerStatus}</p> : null}
        </AppCard>
      </Stack>
      <ActionToast
        open={Boolean(toast)}
        message={toast?.message ?? ""}
        tone={toast?.tone ?? "neutral"}
        onDismiss={() => setToast(null)}
      />
    </Section>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

function PortalConfigReadView({
  config,
  publicUrl,
}: {
  config: PortalConfigForm
  publicUrl: string
}) {
  const differentials = config.differentials.split("\n").filter(Boolean)
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {READ_FIELDS.map((field) => (
          <div key={field.key} className="min-w-0 space-y-0.5">
            <dt className="text-xs text-muted-foreground">{field.label}</dt>
            <dd className="truncate text-foreground" title={config[field.key] || undefined}>
              {config[field.key] || "—"}
            </dd>
          </div>
        ))}
        <div className="min-w-0 space-y-0.5 sm:col-span-2 lg:col-span-3">
          <dt className="text-xs text-muted-foreground">URL pública</dt>
          <dd className="truncate">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              {publicUrl}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </dd>
        </div>
      </dl>
      <div className="grid gap-3 sm:grid-cols-3">
        {IMAGE_FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <p className="text-xs text-muted-foreground">{field.label}</p>
            {config[field.key] ? (
              <ImagePreview url={config[field.key]} alt={field.label} />
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
        ))}
      </div>
      {config.aboutText ? (
        <div className="space-y-0.5 text-sm">
          <p className="text-xs text-muted-foreground">Texto institucional</p>
          <p className="whitespace-pre-line">{config.aboutText}</p>
        </div>
      ) : null}
      {differentials.length > 0 ? (
        <div className="space-y-1 text-sm">
          <p className="text-xs text-muted-foreground">Diferenciais</p>
          <ul className="list-inside list-disc">
            {differentials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function FieldMessage({ children }: { children: string }) {
  return <p className="text-xs text-destructive">{children}</p>
}

function CharacterCount({
  length,
  max,
  atLimit,
  invalid,
}: {
  length: number
  max: number
  atLimit: boolean
  invalid: boolean
}) {
  const counter = characterCounter(length, max)
  return (
    <p className={cn("text-xs", invalid || atLimit ? "text-destructive" : "text-muted-foreground")}>
      {counter.label}
      {atLimit ? ` Limite máximo de ${max} caracteres atingido.` : null}
    </p>
  )
}

function TextField({
  id,
  label,
  type,
  placeholder,
  helpText,
  value,
  max,
  feedback,
  onChange,
}: {
  id: string
  label: string
  type?: string
  placeholder?: string
  helpText?: string
  value: string
  max: number
  feedback: { error: string | null; atLimit: boolean }
  onChange: (value: string) => void
}) {
  const invalid = Boolean(feedback.error) || feedback.atLimit
  return (
    <label htmlFor={id} className="space-y-1 text-xs text-muted-foreground">
      {label}
      <Input
        id={id}
        type={type ?? "text"}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
      />
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
      <CharacterCount length={value.length} max={max} atLimit={feedback.atLimit} invalid={Boolean(feedback.error)} />
      {feedback.error ? <FieldMessage>{feedback.error}</FieldMessage> : null}
    </label>
  )
}

function CountedTextarea({
  id,
  label,
  helpText,
  value,
  max,
  length,
  feedback,
  onChange,
  className,
}: {
  id: string
  label: string
  helpText?: string
  value: string
  max: number
  length?: number
  feedback: { error: string | null; atLimit: boolean }
  onChange: (value: string) => void
  className?: string
}) {
  const invalid = Boolean(feedback.error) || feedback.atLimit
  const counted = length ?? value.length
  return (
    <label htmlFor={id} className={cn("space-y-1 text-xs text-muted-foreground", className)}>
      {label}
      <textarea
        id={id}
        aria-invalid={invalid}
        className={cn(
          "min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm",
          invalid ? "border-destructive" : "border-input",
        )}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
      <CharacterCount length={counted} max={max} atLimit={feedback.atLimit} invalid={Boolean(feedback.error)} />
      {feedback.error ? <FieldMessage>{feedback.error}</FieldMessage> : null}
    </label>
  )
}

function FileButton({
  label,
  disabled,
  onSelect,
}: {
  label: string
  disabled?: boolean
  onSelect: (file: File | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          onSelect(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      <Button type="button" variant="outline" disabled={disabled} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
    </>
  )
}

function PortalImageField({
  label,
  url,
  busy,
  invalid,
  onSelect,
  onRemove,
}: {
  label: string
  url: string
  busy: boolean
  invalid?: boolean
  onSelect: (file: File | undefined) => void
  onRemove: () => void
}) {
  return (
    <div className={cn("space-y-2 text-xs text-muted-foreground", invalid && "text-destructive")}>
      <p className="font-medium">{label}</p>
      {url ? <ImagePreview url={url} alt={label} /> : null}
      <div className="flex flex-wrap gap-2">
        <FileButton
          label={busy ? "Enviando…" : url ? "Trocar imagem" : "Enviar imagem"}
          disabled={busy}
          onSelect={onSelect}
        />
        {url ? (
          <Button type="button" variant="outline" onClick={onRemove}>
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  )
}
