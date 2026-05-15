"use client";

import * as React from "react";
import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { cn } from "../lib/cn";

export type KanbanCard = {
  id: string;
  title: string;
  description?: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type KanbanMovePayload = {
  cardId: string;
  fromColumnId: string;
  toColumnId: string;
  /** Target index within the destination column after the move */
  toIndex: number;
};

export function applyKanbanMove(
  columns: KanbanColumn[],
  p: KanbanMovePayload,
): KanbanColumn[] {
  const next = columns.map((c) => ({ ...c, cards: [...c.cards] }));
  const from = next.find((c) => c.id === p.fromColumnId);
  const to = next.find((c) => c.id === p.toColumnId);
  if (!from || !to) return columns;

  const cardIdx = from.cards.findIndex((c) => c.id === p.cardId);
  if (cardIdx < 0) return columns;

  const removed = from.cards.splice(cardIdx, 1);
  const card = removed[0];
  if (!card) return columns;

  if (p.fromColumnId === p.toColumnId) {
    let insertAt = p.toIndex;
    if (cardIdx < insertAt) insertAt -= 1;
    insertAt = Math.max(0, Math.min(insertAt, from.cards.length));
    from.cards.splice(insertAt, 0, card);
  } else {
    const insertAt = Math.max(0, Math.min(p.toIndex, to.cards.length));
    to.cards.splice(insertAt, 0, card);
  }

  return next;
}

function findColumnForCardId(
  columns: KanbanColumn[],
  cardId: string,
): string | null {
  for (const col of columns) {
    if (col.cards.some((c) => c.id === cardId)) return col.id;
  }
  return null;
}

function dropId(columnId: string) {
  return `kanban-drop-${columnId}`;
}

function SortableKanbanCard({
  card,
  renderCard,
}: {
  card: KanbanCard;
  renderCard?: (card: KanbanCard) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none rounded-lg border border-border bg-card p-3 text-sm shadow-if-sm ring-1 ring-foreground/5",
        isDragging && "z-10 opacity-60 shadow-if-md",
      )}
      {...attributes}
      {...listeners}
    >
      {renderCard ? (
        renderCard(card)
      ) : (
        <>
          <div className="font-medium text-foreground">{card.title}</div>
          {card.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {card.description}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function KanbanColumnLane({
  column,
  renderCard,
}: {
  column: KanbanColumn;
  renderCard?: (card: KanbanCard) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId(column.id),
    data: { type: "column", columnId: column.id },
  });
  const ids = column.cards.map((c) => c.id);

  return (
    <div className="flex min-w-[260px] max-w-xs flex-1 flex-col rounded-xl border border-border bg-muted/25">
      <div className="border-b border-border px-3 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
        <p className="text-xs text-muted-foreground">
          {column.cards.length}{" "}
          {column.cards.length === 1 ? "cartão" : "cartões"}
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-40 flex-1 flex-col gap-2 p-3 transition-colors",
          isOver && "bg-primary/5",
        )}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <SortableKanbanCard key={card.id} card={card} renderCard={renderCard} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export type KanbanProps = {
  columns: KanbanColumn[];
  onCardMove?: (payload: KanbanMovePayload) => void;
  renderCard?: (card: KanbanCard) => React.ReactNode;
  className?: string;
};

export function Kanban({ columns, onCardMove, renderCard, className }: KanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCard = React.useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const c = col.cards.find((x) => x.id === activeId);
      if (c) return c;
    }
    return null;
  }, [activeId, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const overId = String(over.id);

    const fromColumnId = findColumnForCardId(columns, cardId);
    if (!fromColumnId) return;

    let toColumnId: string | null = null;
    let toIndex = 0;

    if (overId.startsWith("kanban-drop-")) {
      toColumnId = overId.replace("kanban-drop-", "");
      toIndex = columns.find((c) => c.id === toColumnId)?.cards.length ?? 0;
      /* dropped on empty / column surface — if same card count includes self, adjust */
      if (fromColumnId === toColumnId) {
        toIndex = columns.find((c) => c.id === toColumnId)!.cards.length - 1;
        toIndex = Math.max(0, toIndex);
      }
    } else {
      toColumnId = findColumnForCardId(columns, overId);
      if (!toColumnId) return;
      const destCol = columns.find((c) => c.id === toColumnId)!;
      toIndex = destCol.cards.findIndex((c) => c.id === overId);
      if (toIndex < 0) toIndex = destCol.cards.length;
    }

    if (!toColumnId) return;

    if (fromColumnId === toColumnId && cardId === overId) return;

    onCardMove?.({
      cardId,
      fromColumnId,
      toColumnId,
      toIndex,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        className={cn(
          "flex min-h-[320px] gap-4 overflow-x-auto pb-2",
          className,
        )}
      >
        {columns.map((col) => (
          <KanbanColumnLane
            key={col.id}
            column={col}
            renderCard={renderCard}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="w-[260px] rounded-lg border border-border bg-card p-3 text-sm shadow-if-lg">
            <div className="font-medium">{activeCard.title}</div>
            {activeCard.description ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {activeCard.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
