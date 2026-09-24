"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"

import { AppCard, Section, Stack } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"

type PortalConfigForm = {
  companyName: string
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  logoUrl: string
  aboutTitle: string
  aboutText: string
  aboutImage: string
  differentials: string
  whatsapp: string
  phone: string
  email: string
  instagram: string
  facebook: string
  youtube: string
  creci: string
  address: string
}

type Banner = {
  id: string
  title: string
  subtitle?: string | null
  image: string
  link?: string | null
  active: boolean
  order: number
}

type ImageKey = "logoUrl" | "heroImage" | "aboutImage"

const EMPTY: PortalConfigForm = {
  companyName: "",
  heroTitle: "",
  heroSubtitle: "",
  heroImage: "",
  logoUrl: "",
  aboutTitle: "",
  aboutText: "",
  aboutImage: "",
  differentials: "",
  whatsapp: "",
  phone: "",
  email: "",
  instagram: "",
  facebook: "",
  youtube: "",
  creci: "",
  address: "",
}

const IMAGE_FIELDS: { key: ImageKey; label: string }[] = [
  { key: "logoUrl", label: "Logo" },
  { key: "heroImage", label: "Hero" },
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
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message
    throw new Error(message || "Não foi possível enviar a imagem.")
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

export function PortalSettingsPanel() {
  const businessUnitId = useRealEstateBusinessUnitId()
  const [form, setForm] = useState<PortalConfigForm>(EMPTY)
  const [banners, setBanners] = useState<Banner[]>([])
  const [banner, setBanner] = useState({
    title: "",
    subtitle: "",
    image: "",
    link: "",
    order: "0",
  })
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    if (!businessUnitId) return
    const query = `?businessUnitId=${encodeURIComponent(businessUnitId)}`
    void fetch(`/api/portal-config${query}`)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((data: (PortalConfigForm & { differentials?: string[] }) | null) => {
        if (!data) return
        setForm({
          ...EMPTY,
          ...data,
          differentials: Array.isArray(data.differentials) ? data.differentials.join("\n") : "",
        })
      })
    void fetch(`/api/portal-banners${query}`)
      .then(async (response) => (response.ok ? response.json() : []))
      .then((data: Banner[]) => setBanners(Array.isArray(data) ? data : []))
  }, [businessUnitId])

  function update(key: keyof PortalConfigForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveConfig(event: FormEvent) {
    event.preventDefault()
    if (!businessUnitId) return
    setSaving(true)
    setStatus(null)
    const response = await fetch("/api/portal-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessUnitId,
        ...form,
        differentials: form.differentials
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    })
    setSaving(false)
    setStatus(response.ok ? "Configuração salva." : "Não foi possível salvar.")
  }

  async function onConfigImage(key: ImageKey, file: File | undefined) {
    if (!businessUnitId || !file) return
    setUploading(key)
    setStatus(null)
    try {
      const url = await uploadPortalImage(businessUnitId, file, form[key])
      update(key, url)
      setStatus("Imagem enviada. Salve o portal para publicar.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível enviar a imagem.")
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
      setStatus("Não foi possível criar o banner.")
      return
    }
    const created = (await response.json()) as Banner
    setBanners((current) => [...current, created].sort((a, b) => a.order - b.order))
    setBanner({ title: "", subtitle: "", image: "", link: "", order: "0" })
  }

  async function onBannerFile(file: File | undefined) {
    if (!businessUnitId || !file) return
    setUploading("banner")
    setStatus(null)
    try {
      const url = await uploadPortalImage(businessUnitId, file, banner.image)
      setBanner((current) => ({ ...current, image: url }))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível enviar a imagem.")
    } finally {
      setUploading(null)
    }
  }

  async function replaceBanner(item: Banner, file: File | undefined) {
    if (!businessUnitId || !file) return
    setUploading(item.id)
    setStatus(null)
    try {
      const url = await uploadPortalImage(businessUnitId, file, item.image)
      const response = await fetch(`/api/portal-banners/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      })
      if (!response.ok) {
        setStatus("Não foi possível substituir a imagem do banner.")
        return
      }
      const updated = (await response.json()) as Banner
      setBanners((current) => current.map((entry) => (entry.id === item.id ? updated : entry)))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Não foi possível substituir a imagem.")
    } finally {
      setUploading(null)
    }
  }

  async function removeBanner(id: string) {
    const response = await fetch(`/api/portal-banners/${id}`, { method: "DELETE" })
    if (response.ok) setBanners((current) => current.filter((item) => item.id !== id))
  }

  const fields: { key: keyof PortalConfigForm; label: string }[] = [
    { key: "companyName", label: "Nome da imobiliária" },
    { key: "heroTitle", label: "Hero — título" },
    { key: "heroSubtitle", label: "Hero — subtítulo" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "phone", label: "Telefone" },
    { key: "email", label: "E-mail" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "youtube", label: "YouTube" },
    { key: "creci", label: "CRECI" },
    { key: "address", label: "Endereço" },
    { key: "aboutTitle", label: "Título institucional" },
  ]

  return (
    <Section>
      <Stack gap="sm">
        <AppCard padding="compact" className="space-y-4">
          <p className="text-sm font-medium">Configuração Portal Comercial</p>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={saveConfig}>
            {fields.map((field) => (
              <label key={field.key} className="space-y-1 text-xs text-muted-foreground">
                {field.label}
                <Input
                  value={form[field.key]}
                  onChange={(event) => update(field.key, event.target.value)}
                  required={field.key === "companyName"}
                />
              </label>
            ))}
            {IMAGE_FIELDS.map((field) => (
              <PortalImageField
                key={field.key}
                label={field.label}
                url={form[field.key]}
                busy={uploading === field.key}
                onSelect={(file) => void onConfigImage(field.key, file)}
                onRemove={() => update(field.key, "")}
              />
            ))}
            <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
              Institucional
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.aboutText}
                onChange={(event) => update("aboutText", event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground md:col-span-2">
              Diferenciais
              <textarea
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.differentials}
                onChange={(event) => update("differentials", event.target.value)}
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving || !businessUnitId}>
                {saving ? "Salvando…" : "Salvar portal"}
              </Button>
            </div>
          </form>
          {status ? <p className="text-sm">{status}</p> : null}
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
              </li>
            ))}
            {banners.length === 0 ? <li className="text-muted-foreground">Nenhum banner.</li> : null}
          </ul>
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
        </AppCard>
      </Stack>
    </Section>
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
  onSelect,
  onRemove,
}: {
  label: string
  url: string
  busy: boolean
  onSelect: (file: File | undefined) => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <p>{label}</p>
      {url ? <ImagePreview url={url} alt={label} /> : null}
      <div className="flex flex-wrap gap-2">
        <FileButton
          label={busy ? "Enviando…" : url ? "Substituir" : "Enviar imagem"}
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
