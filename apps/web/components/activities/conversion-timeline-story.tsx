import type { ConversionTimelineStory } from "@/lib/crm/conversion-timeline"

type ConversionTimelineStoryCardProps = {
  story: ConversionTimelineStory
}

/** Sequência visual da conversão já registrada — sem gravar atividade nova. */
export function ConversionTimelineStoryCard({
  story,
}: ConversionTimelineStoryCardProps) {
  return (
    <li
      className="timeline-entry timeline-entry--v2"
      data-occurred-at={story.occurredAt}
      data-conversion-story="true"
    >
      <span className="timeline-node" aria-hidden>
        <span className="size-2 rounded-full bg-emerald-400" />
      </span>
      <article className="timeline-card">
        <header className="timeline-card__header">
          <h4 className="timeline-card__subject">Conversão em negócio</h4>
        </header>
        <ol className="mt-2 flex flex-col gap-1">
          {story.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-2 text-sm">
              <span className="w-3 shrink-0 text-center text-muted-foreground">
                {index === 0 ? "" : "↓"}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </article>
    </li>
  )
}
