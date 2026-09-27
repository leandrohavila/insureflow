"use client"

import { Mail, MapPin, MessageCircle, Phone } from "lucide-react"

import type { PortalConfigForm } from "@/lib/real-estate/portal-config-form"

export function PortalLivePreview({
  form,
  publicUrl,
}: {
  form: PortalConfigForm
  publicUrl: string
}) {
  const companyName = form.companyName.trim() || "Nome da imobiliária"
  const differentials = form.differentials
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
  const socials = [
    { label: "Instagram", value: form.instagram },
    { label: "Facebook", value: form.facebook },
    { label: "YouTube", value: form.youtube },
  ].filter((item) => item.value.trim())

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-white text-slate-900 shadow-sm"
      aria-label="Preview do portal"
    >
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-1.5">
        <span className="flex gap-1" aria-hidden>
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded bg-white px-2 py-0.5 text-[0.65rem] text-slate-500">
          {publicUrl}
        </span>
      </div>

      <header className="flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {form.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logoUrl} alt="" className="h-6 w-auto max-w-16 object-contain" />
          ) : null}
          <span className="truncate text-sm font-semibold">{companyName}</span>
        </div>
        {form.whatsapp.trim() ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[0.65rem] font-medium text-white">
            <MessageCircle className="size-3" aria-hidden />
            {form.whatsapp}
          </span>
        ) : null}
      </header>

      <section
        className="relative flex min-h-40 flex-col justify-end bg-slate-800 bg-cover bg-center px-4 py-5 text-white"
        style={form.heroImage ? { backgroundImage: `url("${form.heroImage}")` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-slate-950/20" aria-hidden />
        <div className="relative space-y-1">
          <p className="text-lg font-semibold leading-tight">
            {form.heroTitle.trim() || "Título do hero"}
          </p>
          <p className="text-xs text-white/85">
            {form.heroSubtitle.trim() || "Subtítulo do hero"}
          </p>
        </div>
      </section>

      <section className="space-y-2 px-4 py-4">
        <p className="text-sm font-semibold">
          {form.aboutTitle.trim() || "Título institucional"}
        </p>
        <div className="flex gap-3">
          {form.aboutImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.aboutImage} alt="" className="h-16 w-20 shrink-0 rounded object-cover" />
          ) : null}
          <p className="line-clamp-4 whitespace-pre-line text-xs text-slate-600">
            {form.aboutText.trim() || "Texto institucional da imobiliária."}
          </p>
        </div>
        {differentials.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {differentials.map((item) => (
              <li key={item} className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <footer className="space-y-1.5 bg-slate-900 px-4 py-3 text-[0.65rem] text-slate-300">
        <p className="text-xs font-semibold text-white">{companyName}</p>
        {form.phone.trim() ? (
          <p className="flex items-center gap-1.5">
            <Phone className="size-3" aria-hidden />
            {form.phone}
          </p>
        ) : null}
        {form.email.trim() ? (
          <p className="flex items-center gap-1.5">
            <Mail className="size-3" aria-hidden />
            {form.email}
          </p>
        ) : null}
        {form.address.trim() ? (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3" aria-hidden />
            {form.address}
          </p>
        ) : null}
        {socials.length > 0 ? (
          <p>{socials.map((item) => `${item.label}: ${item.value}`).join(" · ")}</p>
        ) : null}
        {form.creci.trim() ? <p>CRECI {form.creci}</p> : null}
      </footer>
    </div>
  )
}
