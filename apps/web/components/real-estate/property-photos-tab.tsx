"use client"

import { useRef, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
} from "lucide-react"

import { AppCard, Section, Stack } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  useDeletePropertyImage,
  useProperty,
  useReorderPropertyImages,
  useSetPropertyCoverImage,
  useUploadPropertyImages,
} from "@/lib/data-access/modules/properties"
import type { PropertyImage } from "@/lib/data-access/modules/properties"
import { getErrorMessage } from "@/lib/data-access"

type PropertyPhotosTabProps = {
  propertyId: string
}

export function PropertyPhotosTab({ propertyId }: PropertyPhotosTabProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const propertyQuery = useProperty(propertyId)
  const upload = useUploadPropertyImages()
  const reorder = useReorderPropertyImages()
  const setCover = useSetPropertyCoverImage()
  const remove = useDeletePropertyImage()
  const [localOrder, setLocalOrder] = useState<string[] | null>(null)

  const images = propertyQuery.data?.images ?? []
  const orderedIds =
    localOrder ??
    [...images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((image) => image.id)

  const orderedImages = orderedIds
    .map((id) => images.find((image) => image.id === id))
    .filter((image): image is PropertyImage => Boolean(image))

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return
    await upload.mutateAsync({
      id: propertyId,
      files: Array.from(files),
    })
    setLocalOrder(null)
  }

  function moveImage(imageId: string, direction: -1 | 1) {
    const index = orderedIds.indexOf(imageId)
    if (index < 0) return
    const target = index + direction
    if (target < 0 || target >= orderedIds.length) return

    const next = [...orderedIds]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    setLocalOrder(next)
  }

  async function persistOrder() {
    if (!localOrder) return
    await reorder.mutateAsync({ id: propertyId, imageIds: localOrder })
    setLocalOrder(null)
  }

  const busy =
    upload.isPending ||
    reorder.isPending ||
    setCover.isPending ||
    remove.isPending

  return (
    <Section>
      <Stack gap="sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void handleUpload(event.target.files)
              event.target.value = ""
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 size-4" />
            )}
            Enviar fotos
          </Button>
          {localOrder ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={reorder.isPending}
              onClick={() => void persistOrder()}
            >
              Salvar ordem
            </Button>
          ) : null}
        </div>

        {(upload.error ?? reorder.error ?? setCover.error ?? remove.error) ? (
          <p className="text-sm text-destructive">
            {getErrorMessage(
              upload.error ??
                reorder.error ??
                setCover.error ??
                remove.error,
            )}
          </p>
        ) : null}

        {orderedImages.length === 0 ? (
          <AppCard padding="compact">
            <p className="text-sm text-muted-foreground">
              Nenhuma foto enviada. Use o botão acima para adicionar imagens ao
              imóvel.
            </p>
          </AppCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orderedImages.map((image, index) => (
              <AppCard key={image.id} padding="compact" className="space-y-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt ?? "Foto do imóvel"}
                    className="size-full object-cover"
                  />
                  {image.isCover ? (
                    <Badge className="absolute left-2 top-2">Capa</Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy || image.isCover}
                    onClick={() =>
                      setCover.mutate({
                        propertyId,
                        imageId: image.id,
                      })
                    }
                  >
                    <Star className="mr-1.5 size-4" />
                    Capa
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    disabled={busy || index === 0}
                    onClick={() => moveImage(image.id, -1)}
                    aria-label="Mover para cima"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    disabled={busy || index === orderedImages.length - 1}
                    onClick={() => moveImage(image.id, 1)}
                    aria-label="Mover para baixo"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() =>
                      remove.mutate({ propertyId, imageId: image.id })
                    }
                    aria-label="Excluir foto"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </AppCard>
            ))}
          </div>
        )}
      </Stack>
    </Section>
  )
}
