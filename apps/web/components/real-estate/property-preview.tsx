"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Property } from "@/lib/data-access/modules/properties"
import {
  formatPropertyPrice,
  PROPERTY_PURPOSE_LABELS,
} from "@/lib/real-estate/labels"

function coverOf(property: Property) {
  const images = [...(property.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )
  return images.find((image) => image.isCover) ?? images[0] ?? property.coverImage
}

export function PropertyPreviewDialog({
  property,
  open,
  onOpenChange,
}: {
  property: Property | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const cover = property ? coverOf(property) : null
  const place = property
    ? [property.neighborhood, property.city].filter(Boolean).join(", ")
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pré-visualização do portal</DialogTitle>
          <DialogDescription>
            {property
              ? `Como o imóvel aparece antes de ir ao ar em /imoveis/${property.slug}`
              : "Selecione um imóvel."}
          </DialogDescription>
        </DialogHeader>
        {property ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              <Badge variant={property.published ? "default" : "secondary"}>
                {property.published ? "Publicado no Portal" : "Não publicado"}
              </Badge>
              {property.featured ? <Badge>Destaque</Badge> : null}
            </div>
            <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">
              {cover?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cover.url}
                  alt={cover.alt ?? property.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Sem foto
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              /imoveis/{property.slug}
            </p>
            <h2 className="text-lg font-semibold">{property.title}</h2>
            <p className="font-medium">
              {formatPropertyPrice(property.price, property.purpose)}
            </p>
            <p className="text-sm text-muted-foreground">
              {PROPERTY_PURPOSE_LABELS[property.purpose] ?? property.purpose}
              {place ? ` · ${place}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              Ordem de exibição: {property.portalOrder ?? 0}
            </p>
            {property.description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {property.description}
              </p>
            ) : null}
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">SEO</p>
              <p className="mt-1">
                Title: {property.metaTitle?.trim() || property.title}
              </p>
              <p className="text-muted-foreground">
                Description:{" "}
                {property.metaDescription?.trim() ||
                  property.description?.trim()?.slice(0, 160) ||
                  property.title}
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
