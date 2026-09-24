"use client"

import { useEffect, useState, type FormEvent } from "react"

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

export function PortalSettingsPanel() {
  const businessUnitId = useRealEstateBusinessUnitId()
  const [form, setForm] = useState<PortalConfigForm>(EMPTY)
  const [banners, setBanners] = useState<Banner[]>([])
  const [banner, setBanner] = useState({ title: "", subtitle: "", image: "", link: "", order: "0" })
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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

  async function addBanner(event: FormEvent) {
    event.preventDefault()
    if (!businessUnitId || !banner.title.trim() || !banner.image.trim()) return
    const response = await fetch("/api/portal-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessUnitId,
        title: banner.title.trim(),
        subtitle: banner.subtitle.trim() || undefined,
        image: banner.image.trim(),
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

  async function removeBanner(id: string) {
    const response = await fetch(`/api/portal-banners/${id}`, { method: "DELETE" })
    if (response.ok) setBanners((current) => current.filter((item) => item.id !== id))
  }

  const fields: { key: keyof PortalConfigForm; label: string }[] = [
    { key: "companyName", label: "Nome da imobiliária" },
    { key: "heroTitle", label: "Hero — título" },
    { key: "heroSubtitle", label: "Hero — subtítulo" },
    { key: "heroImage", label: "Hero — imagem" },
    { key: "logoUrl", label: "Logo" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "phone", label: "Telefone" },
    { key: "email", label: "E-mail" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "youtube", label: "YouTube" },
    { key: "creci", label: "CRECI" },
    { key: "address", label: "Endereço" },
    { key: "aboutTitle", label: "Título institucional" },
    { key: "aboutImage", label: "Imagem institucional (URL)" },
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
          <ul className="space-y-2 text-sm">
            {banners.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3">
                <span>
                  {item.order}. {item.title}
                </span>
                <Button type="button" variant="outline" onClick={() => removeBanner(item.id)}>
                  Remover
                </Button>
              </li>
            ))}
            {banners.length === 0 ? <li className="text-muted-foreground">Nenhum banner.</li> : null}
          </ul>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={addBanner}>
            <Input placeholder="Título" value={banner.title} onChange={(event) => setBanner({ ...banner, title: event.target.value })} />
            <Input placeholder="Subtítulo" value={banner.subtitle} onChange={(event) => setBanner({ ...banner, subtitle: event.target.value })} />
            <Input placeholder="URL da imagem" value={banner.image} onChange={(event) => setBanner({ ...banner, image: event.target.value })} />
            <Input placeholder="Link" value={banner.link} onChange={(event) => setBanner({ ...banner, link: event.target.value })} />
            <Input placeholder="Ordem" value={banner.order} onChange={(event) => setBanner({ ...banner, order: event.target.value })} />
            <Button type="submit" disabled={!businessUnitId}>Adicionar banner</Button>
          </form>
        </AppCard>
      </Stack>
    </Section>
  )
}
