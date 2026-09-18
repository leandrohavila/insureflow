import { PlaceholderPage } from "@/components/design-system"

type SectionPlaceholderProps = {
  title: string
  description?: string
}

export function SectionPlaceholder({
  title,
  description = "Estamos preparando esta área do InsureFlow. Em breve você poderá gerenciar tudo por aqui.",
}: SectionPlaceholderProps) {
  return <PlaceholderPage title={title} description={description} />
}
