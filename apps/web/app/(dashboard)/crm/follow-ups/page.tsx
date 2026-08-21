import { FollowUpsWorkspace } from "@/components/crm/follow-ups-workspace"
import { PageHeader } from "@/components/design-system"

export default function CrmFollowUpsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
      <PageHeader
        compact
        title="Follow-ups"
        description="Fila de próximos contatos — hoje, atrasados e próximos 7 dias."
      />
      <FollowUpsWorkspace />
    </div>
  )
}
