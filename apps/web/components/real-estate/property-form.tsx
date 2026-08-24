"use client"

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"

import {
  ContentContainer,
  FormField,
  FormLayout,
  FormSelect,
  PageContainer,
  PageHeader,
  Section,
  Stack,
} from "@/components/design-system"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PropertyPhotosTab } from "@/components/real-estate/property-photos-tab"
import {
  useCreateProperty,
  useProperty,
  useUpdateProperty,
} from "@/lib/data-access/modules/properties"
import type {
  CreatePropertyInput,
  PropertyPurpose,
  PropertyType,
} from "@/lib/data-access/modules/properties"
import {
  PROPERTY_PURPOSE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/real-estate/labels"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"
import { getErrorMessage } from "@/lib/data-access"
import { dsContentLayoutVariant } from "@/lib/design-system"
import { cn } from "@/lib/utils"

type PropertyFormState = {
  title: string
  description: string
  purpose: PropertyPurpose
  type: PropertyType
  city: string
  neighborhood: string
  price: string
  bedrooms: string
  bathrooms: string
  areaM2: string
}

const EMPTY_FORM: PropertyFormState = {
  title: "",
  description: "",
  purpose: "SALE",
  type: "APARTMENT",
  city: "",
  neighborhood: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  areaM2: "",
}

function toFormState(property: NonNullable<ReturnType<typeof useProperty>["data"]>): PropertyFormState {
  return {
    title: property.title,
    description: property.description ?? "",
    purpose: property.purpose,
    type: property.type,
    city: property.city,
    neighborhood: property.neighborhood ?? "",
    price: String(property.price),
    bedrooms: property.bedrooms != null ? String(property.bedrooms) : "",
    bathrooms: property.bathrooms != null ? String(property.bathrooms) : "",
    areaM2: property.areaM2 != null ? String(property.areaM2) : "",
  }
}

function toPayload(
  form: PropertyFormState,
  businessUnitId: string,
): CreatePropertyInput {
  return {
    businessUnitId,
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    purpose: form.purpose,
    type: form.type,
    city: form.city.trim(),
    neighborhood: form.neighborhood.trim() || undefined,
    price: Number(form.price),
    bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    areaM2: form.areaM2 ? Number(form.areaM2) : undefined,
  }
}

type PropertyFormProps = {
  propertyId?: string
}

export function PropertyForm({ propertyId }: PropertyFormProps) {
  const router = useRouter()
  const businessUnitId = useRealEstateBusinessUnitId()
  const isEdit = Boolean(propertyId)
  const propertyQuery = useProperty(propertyId)
  const createMutation = useCreateProperty()
  const updateMutation = useUpdateProperty()
  const [tab, setTab] = useState<"details" | "photos">("details")
  const [form, setForm] = useState<PropertyFormState>(EMPTY_FORM)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (isEdit && propertyQuery.data && !initialized) {
      setForm(toFormState(propertyQuery.data))
      setInitialized(true)
    }
  }, [initialized, isEdit, propertyQuery.data])

  const saving = createMutation.isPending || updateMutation.isPending
  const saveError =
    createMutation.error ?? updateMutation.error ?? propertyQuery.error

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!businessUnitId) return

    const payload = toPayload(form, businessUnitId)

    if (isEdit && propertyId) {
      await updateMutation.mutateAsync({ id: propertyId, input: payload })
      router.push(`/real-estate/properties/${propertyId}`)
      return
    }

    const created = await createMutation.mutateAsync(payload)
    router.push(`/real-estate/properties/${created.id}`)
  }

  function updateField<K extends keyof PropertyFormState>(
    key: K,
    value: PropertyFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const title = isEdit ? "Editar imóvel" : "Novo imóvel"

  return (
    <PageContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[var(--if-space-2)] md:py-[var(--if-space-3)]">
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <Stack gap="sm">
          <PageHeader
            title={title}
            description="Cadastre os dados principais do imóvel."
            actions={
              <Link
                href="/real-estate/properties"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <ArrowLeft className="mr-1.5 size-4" />
                Voltar
              </Link>
            }
          />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={tab === "details" ? "default" : "outline"}
              onClick={() => setTab("details")}
            >
              Dados
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tab === "photos" ? "default" : "outline"}
              disabled={!isEdit}
              onClick={() => setTab("photos")}
            >
              Fotos
            </Button>
          </div>

          {tab === "photos" && propertyId ? (
            <PropertyPhotosTab propertyId={propertyId} />
          ) : (
            <Section>
              <form onSubmit={handleSubmit} className="space-y-[var(--if-space-4)]">
                {!businessUnitId ? (
                  <p className="text-sm text-destructive">
                    Selecione uma unidade imobiliária para continuar.
                  </p>
                ) : null}

                <FormLayout>
                  <FormField label="Título" htmlFor="title" required fullWidth>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(event) =>
                        updateField("title", event.target.value)
                      }
                      required
                    />
                  </FormField>

                  <FormField label="Finalidade" htmlFor="purpose" required>
                    <FormSelect
                      id="purpose"
                      value={form.purpose}
                      onChange={(event) =>
                        updateField(
                          "purpose",
                          event.target.value as PropertyPurpose,
                        )
                      }
                      options={Object.entries(PROPERTY_PURPOSE_LABELS).map(
                        ([value, label]) => ({ value, label }),
                      )}
                    />
                  </FormField>

                  <FormField label="Tipo" htmlFor="type">
                    <FormSelect
                      id="type"
                      value={form.type}
                      onChange={(event) =>
                        updateField("type", event.target.value as PropertyType)
                      }
                      options={Object.entries(PROPERTY_TYPE_LABELS).map(
                        ([value, label]) => ({ value, label }),
                      )}
                    />
                  </FormField>

                  <FormField label="Cidade" htmlFor="city" required>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(event) =>
                        updateField("city", event.target.value)
                      }
                      required
                    />
                  </FormField>

                  <FormField label="Bairro" htmlFor="neighborhood">
                    <Input
                      id="neighborhood"
                      value={form.neighborhood}
                      onChange={(event) =>
                        updateField("neighborhood", event.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Valor (R$)" htmlFor="price" required>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      step={1}
                      value={form.price}
                      onChange={(event) =>
                        updateField("price", event.target.value)
                      }
                      required
                    />
                  </FormField>

                  <FormField label="Quartos" htmlFor="bedrooms">
                    <Input
                      id="bedrooms"
                      type="number"
                      min={0}
                      value={form.bedrooms}
                      onChange={(event) =>
                        updateField("bedrooms", event.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Banheiros" htmlFor="bathrooms">
                    <Input
                      id="bathrooms"
                      type="number"
                      min={0}
                      value={form.bathrooms}
                      onChange={(event) =>
                        updateField("bathrooms", event.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Área (m²)" htmlFor="areaM2">
                    <Input
                      id="areaM2"
                      type="number"
                      min={0}
                      value={form.areaM2}
                      onChange={(event) =>
                        updateField("areaM2", event.target.value)
                      }
                    />
                  </FormField>

                  <FormField label="Descrição" htmlFor="description" fullWidth>
                    <textarea
                      id="description"
                      rows={5}
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      value={form.description}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                        updateField("description", event.target.value)
                      }
                    />
                  </FormField>
                </FormLayout>

                {saveError ? (
                  <p className="text-sm text-destructive">
                    {getErrorMessage(saveError)}
                  </p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={saving || !businessUnitId}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Salvando…
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>
                </div>
              </form>
            </Section>
          )}
        </Stack>
      </ContentContainer>
    </PageContainer>
  )
}
