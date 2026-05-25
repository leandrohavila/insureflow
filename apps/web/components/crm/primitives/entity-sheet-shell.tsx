"use client"

import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

import { RecordRow } from "./record-row"

/* -------------------------------------------------------------------------- */
/* Width variants                                                              */
/* -------------------------------------------------------------------------- */

export type EntitySheetShellWidth = "compact" | "default" | "wide"

/**
 * Sobrescreve o `data-[side=right]:sm:max-w-sm` que o `SheetContent` base
 * aplica por padrão. Mantemos o mesmo seletor de variant (`data-[side=right]:`)
 * para que o tailwind-merge consiga fazer o merge dentro de `cn(...)`.
 */
const WIDTH_CLASSES: Record<EntitySheetShellWidth, string> = {
  compact:
    "data-[side=right]:sm:max-w-[480px] data-[side=right]:xl:max-w-[600px]",
  default:
    "data-[side=right]:sm:max-w-[600px] data-[side=right]:xl:max-w-[860px] data-[side=right]:2xl:max-w-[1000px]",
  wide: "data-[side=right]:sm:max-w-[680px] data-[side=right]:xl:max-w-[1000px] data-[side=right]:2xl:max-w-[1200px]",
}

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

type EntitySheetShellContextValue = {
  baseId: string
  activeSection: string | null
  setActiveSection: (id: string) => void
  registerTab: (id: string, el: HTMLButtonElement | null) => void
  focusTabByOffset: (id: string, offset: number) => void
  focusTabAtEdge: (edge: "start" | "end") => void
}

const EntitySheetShellContext =
  createContext<EntitySheetShellContextValue | null>(null)

function useEntitySheetShell(component: string) {
  const ctx = useContext(EntitySheetShellContext)
  if (!ctx) {
    throw new Error(
      `<${component}> deve ser usado dentro de <EntitySheetShell>.`,
    )
  }
  return ctx
}

/* -------------------------------------------------------------------------- */
/* Slot detection (compound pattern)                                          */
/* -------------------------------------------------------------------------- */

const HEADER_DN = "EntitySheetShell.Header"
const RAIL_DN = "EntitySheetShell.Rail"
const BODY_DN = "EntitySheetShell.Body"
const RAIL_ITEM_DN = "EntitySheetShell.RailItem"

function findSlot(children: ReactNode, name: string): ReactNode {
  let found: ReactNode = null
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      typeof child.type !== "string" &&
      (child.type as { displayName?: string }).displayName === name
    ) {
      found = child
    }
  })
  return found
}

/* -------------------------------------------------------------------------- */
/* Root                                                                        */
/* -------------------------------------------------------------------------- */

type EntitySheetShellProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Controlado quando definido. Se ausente, opera em modo uncontrolled usando
   * `defaultActiveSection` como valor inicial.
   */
  activeSection?: string | null
  defaultActiveSection?: string | null
  onSectionChange?: (id: string) => void
  /**
   * Rótulo acessível obrigatório (lido por leitores de tela antes do header
   * visual — substitui o `SheetTitle` visualmente oculto).
   */
  ariaLabel: string
  /** Descrição complementar opcional para SR. */
  ariaDescription?: string
  width?: EntitySheetShellWidth
  className?: string
  children: ReactNode
}

function EntitySheetShellRoot({
  open,
  onOpenChange,
  activeSection,
  defaultActiveSection = null,
  onSectionChange,
  ariaLabel,
  ariaDescription,
  width = "default",
  className,
  children,
}: EntitySheetShellProps) {
  const reactId = useId()
  const baseId = `entity-sheet-${reactId.replace(/:/g, "")}`

  const isControlled = activeSection !== undefined
  const [internalSection, setInternalSection] = useState<string | null>(
    defaultActiveSection,
  )
  const currentSection =
    (isControlled ? activeSection : internalSection) ?? null

  const setActiveSection = useCallback(
    (id: string) => {
      if (!isControlled) setInternalSection(id)
      onSectionChange?.(id)
    },
    [isControlled, onSectionChange],
  )

  // Registro de refs dos tabs para roving tabindex + arrow nav.
  const tabsRef = useRef(new Map<string, HTMLButtonElement>())
  const registerTab = useCallback(
    (id: string, el: HTMLButtonElement | null) => {
      if (el) {
        tabsRef.current.set(id, el)
      } else {
        tabsRef.current.delete(id)
      }
    },
    [],
  )

  const orderedTabIds = useCallback(() => {
    return Array.from(tabsRef.current.entries())
      .filter(([, el]) => el && !el.disabled)
      .sort(([, a], [, b]) => {
        const pos = a.compareDocumentPosition(b)
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1
        return 0
      })
      .map(([id]) => id)
  }, [])

  const focusTabByOffset = useCallback(
    (id: string, offset: number) => {
      const ids = orderedTabIds()
      if (ids.length === 0) return
      const index = ids.indexOf(id)
      if (index === -1) return
      const nextIndex = (index + offset + ids.length) % ids.length
      const nextId = ids[nextIndex]
      if (nextId === undefined) return
      tabsRef.current.get(nextId)?.focus()
    },
    [orderedTabIds],
  )

  const focusTabAtEdge = useCallback(
    (edge: "start" | "end") => {
      const ids = orderedTabIds()
      if (ids.length === 0) return
      const targetId = edge === "start" ? ids[0] : ids[ids.length - 1]
      if (targetId === undefined) return
      tabsRef.current.get(targetId)?.focus()
    },
    [orderedTabIds],
  )

  const contextValue = useMemo<EntitySheetShellContextValue>(
    () => ({
      baseId,
      activeSection: currentSection,
      setActiveSection,
      registerTab,
      focusTabByOffset,
      focusTabAtEdge,
    }),
    [
      baseId,
      currentSection,
      setActiveSection,
      registerTab,
      focusTabByOffset,
      focusTabAtEdge,
    ],
  )

  const headerSlot = findSlot(children, HEADER_DN)
  const railSlot = findSlot(children, RAIL_DN)
  const bodySlot = findSlot(children, BODY_DN)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          // Tokens do crm-v2 resolvem aqui dentro do portal.
          "crm-workspace entity-sheet-shell",
          "flex h-full w-full flex-col gap-0 p-0",
          "border-l",
          WIDTH_CLASSES[width],
          className,
        )}
        style={
          {
            // O `SheetContent` base usa `bg-popover`; sobrescrevemos para a
            // surface base do crm-v2 (consistência com o workspace).
            backgroundColor: "var(--crm-surface-base)",
            borderColor: "var(--crm-stroke-default)",
          } as CSSProperties
        }
      >
        <SheetTitle className="sr-only">{ariaLabel}</SheetTitle>
        {ariaDescription ? (
          <SheetDescription className="sr-only">
            {ariaDescription}
          </SheetDescription>
        ) : null}

        <EntitySheetShellContext.Provider value={contextValue}>
          {headerSlot}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
            {railSlot}
            {bodySlot}
          </div>
        </EntitySheetShellContext.Provider>
      </SheetContent>
    </Sheet>
  )
}

/* -------------------------------------------------------------------------- */
/* Header                                                                      */
/* -------------------------------------------------------------------------- */

type EntitySheetShellHeaderProps = HTMLAttributes<HTMLElement>

/**
 * Header sticky do workspace.
 *
 * Mudança Fase 2.2B: troca `crm-surface-raised` por uma layered surface
 * mais sutil (`color-mix` linear-gradient) que dá contraste sem parecer
 * um "outro card". Padding vertical aumenta para criar respiro premium.
 * O consumer decide o conteúdo (zonas: status / identidade-valor / meta /
 * ações) — este wrapper apenas garante ritmo, breathing room e divisor.
 */
function EntitySheetShellHeader({
  className,
  children,
  ...rest
}: EntitySheetShellHeaderProps) {
  return (
    <header
      className={cn(
        "entity-sheet-shell__header-sticky relative shrink-0",
        "border-b",
        "flex flex-col gap-3.5",
        "px-5 pt-5 pb-4 md:px-7 md:pt-6 md:pb-5",
        // Reservar espaço para o botão de close (top:3 right:3 do SheetContent).
        "pr-12 md:pr-14",
        className,
      )}
      style={{
        // Surface ladder sutil: gradiente quase invisível panel → base.
        // Fica entre crm-surface-base (body) e crm-surface-raised (modals),
        // sem brigar com a hierarquia tipográfica.
        backgroundImage:
          "linear-gradient(180deg, color-mix(in oklch, var(--foreground) 3.5%, var(--background)) 0%, var(--crm-surface-base) 100%)",
        borderColor: "var(--crm-stroke-default)",
      }}
      {...rest}
    >
      {children}
    </header>
  )
}
EntitySheetShellHeader.displayName = HEADER_DN

/* -------------------------------------------------------------------------- */
/* Rail                                                                        */
/* -------------------------------------------------------------------------- */

type EntitySheetShellRailProps = HTMLAttributes<HTMLElement> & {
  /** Rótulo do tablist (lido por SR). */
  label?: string
}

const MD_BREAKPOINT_PX = 768

function EntitySheetShellRail({
  className,
  children,
  label,
  ...rest
}: EntitySheetShellRailProps) {
  const { focusTabByOffset, focusTabAtEdge, activeSection } =
    useEntitySheetShell("EntitySheetShell.Rail")

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const target = event.target as HTMLElement
      const tabId = target.getAttribute("data-rail-tab-id")
      if (!tabId) return

      // Orientação semântica reflete a largura corrente. Em desktop (md+)
      // navegamos com ↑/↓; em mobile (rail horizontal scrollável) com ←/→.
      const isVertical =
        typeof window !== "undefined" &&
        window.innerWidth >= MD_BREAKPOINT_PX

      const prevKey = isVertical ? "ArrowUp" : "ArrowLeft"
      const nextKey = isVertical ? "ArrowDown" : "ArrowRight"

      switch (event.key) {
        case nextKey:
          event.preventDefault()
          focusTabByOffset(tabId, 1)
          break
        case prevKey:
          event.preventDefault()
          focusTabByOffset(tabId, -1)
          break
        case "Home":
          event.preventDefault()
          focusTabAtEdge("start")
          break
        case "End":
          event.preventDefault()
          focusTabAtEdge("end")
          break
        default:
          break
      }
    },
    [focusTabAtEdge, focusTabByOffset],
  )

  return (
    <nav
      role="tablist"
      aria-label={label ?? "Seções do workspace"}
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      data-active-section={activeSection ?? undefined}
      className={cn(
        "shrink-0",
        // Mobile: tira horizontal scrollável acima do body. Compacta para
        // não roubar altura vertical em telas pequenas.
        "flex w-full flex-row gap-1 overflow-x-auto border-b px-2 py-2",
        // Desktop: coluna vertical à esquerda do body, mais respirável.
        "md:w-[224px] md:flex-col md:gap-0.5 md:overflow-x-visible md:overflow-y-auto md:border-r md:border-b-0 md:px-2.5 md:py-3",
        className,
      )}
      style={{
        // Surface ladder: rail um nível abaixo do body — leve, não rouba foco.
        backgroundColor:
          "color-mix(in oklch, var(--foreground) 2%, var(--background))",
        borderColor: "var(--crm-stroke-faint)",
      }}
      {...rest}
    >
      {children}
    </nav>
  )
}
EntitySheetShellRail.displayName = RAIL_DN

/* -------------------------------------------------------------------------- */
/* RailItem                                                                    */
/* -------------------------------------------------------------------------- */

type EntitySheetShellRailItemProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "id"
  | "type"
  | "role"
  | "tabIndex"
  | "aria-selected"
  | "aria-controls"
  | "children"
  | "onClick"
> & {
  id: string
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>
  /** Contagem auxiliar (ex.: nº de atividades). Ignorada se `trailing` definido. */
  count?: number | string | null
  /** Slot alternativo para o canto direito do item (ex.: StatusPill). */
  trailing?: ReactNode
  children: ReactNode
}

function EntitySheetShellRailItem({
  id,
  icon: Icon,
  count,
  trailing,
  disabled,
  children,
  className,
  ...rest
}: EntitySheetShellRailItemProps) {
  const { baseId, activeSection, setActiveSection, registerTab } =
    useEntitySheetShell("EntitySheetShell.RailItem")

  const isActive = activeSection === id

  const handleRef = useCallback(
    (el: HTMLElement | null) => {
      // RecordRow é forwardRef<HTMLElement>; o nó real é HTMLButtonElement
      // quando `interactive` é true (caso deste primitivo). React chama o
      // callback ref com `null` no unmount — daí desregistro automático.
      registerTab(id, el as HTMLButtonElement | null)
    },
    [id, registerTab],
  )

  const trailingNode =
    trailing ??
    (count !== undefined && count !== null && count !== "" ? (
      <RecordRow.Trailing>
        <span className="crm-text-micro tabular-nums">{count}</span>
      </RecordRow.Trailing>
    ) : null)

  return (
    <RecordRow
      ref={handleRef}
      interactive
      density="compact"
      accent={isActive ? "primary" : "none"}
      selected={isActive}
      disabled={disabled}
      role="tab"
      id={`${baseId}-tab-${id}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${id}`}
      tabIndex={isActive ? 0 : -1}
      data-rail-tab-id={id}
      onClick={() => {
        if (disabled) return
        setActiveSection(id)
      }}
      className={cn(
        "rounded-md",
        // Padding um pouco mais generoso para clique confortável + ritmo.
        "py-2 md:py-[7px]",
        // Em mobile (linha horizontal) cada item tem uma largura mínima
        // confortável; em desktop preenche a largura do rail.
        "min-w-[140px] md:w-full md:min-w-0",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...rest}
    >
      {Icon ? (
        <RecordRow.Leading>
          <Icon
            className={cn(
              "size-[15px] shrink-0 transition-colors",
              isActive ? "text-primary" : "text-foreground/55",
            )}
            strokeWidth={1.6}
          />
        </RecordRow.Leading>
      ) : null}
      <RecordRow.Body>
        <RecordRow.Title
          className={cn(
            "text-[12.5px] font-medium tracking-[-0.005em] transition-colors",
            isActive ? "text-foreground" : "text-foreground/78",
          )}
        >
          {children}
        </RecordRow.Title>
      </RecordRow.Body>
      {trailingNode}
    </RecordRow>
  )
}
EntitySheetShellRailItem.displayName = RAIL_ITEM_DN

/* -------------------------------------------------------------------------- */
/* Body                                                                        */
/* -------------------------------------------------------------------------- */

type EntitySheetShellBodyProps = HTMLAttributes<HTMLElement>

function EntitySheetShellBody({
  className,
  children,
  ...rest
}: EntitySheetShellBodyProps) {
  const { baseId, activeSection } = useEntitySheetShell(
    "EntitySheetShell.Body",
  )
  return (
    <main
      role="tabpanel"
      id={
        activeSection ? `${baseId}-panel-${activeSection}` : undefined
      }
      aria-labelledby={
        activeSection ? `${baseId}-tab-${activeSection}` : undefined
      }
      className={cn(
        // Único contêiner com overflow do sheet — day-headers sticky da
        // TimelineLane (Fase 2.2A) usam este nó como contexto.
        "entity-sheet-shell__body-scroll crm-scroll-region min-h-0 min-w-0 flex-1 overflow-y-auto",
        // Ritmo de respiração premium: mais top-padding para destacar a
        // primeira seção; um pouco mais generoso em desktop.
        "px-5 pt-6 pb-8 md:px-7 md:pt-7 md:pb-10",
        className,
      )}
      {...rest}
    >
      {children}
    </main>
  )
}
EntitySheetShellBody.displayName = BODY_DN

/* -------------------------------------------------------------------------- */
/* Compound assembly                                                           */
/* -------------------------------------------------------------------------- */

type EntitySheetShellComponent = typeof EntitySheetShellRoot & {
  Header: typeof EntitySheetShellHeader
  Rail: typeof EntitySheetShellRail
  RailItem: typeof EntitySheetShellRailItem
  Body: typeof EntitySheetShellBody
}

/**
 * Shell composicional para workspaces de entidade (Lead / Deal / etc.).
 *
 * Camada visual aditiva, **sem fetch e sem mutations próprias**: orquestra
 * apenas o layout (header sticky → rail vertical + body único scrollável) e
 * a navegação entre seções via tablist (WAI-ARIA Tabs).
 *
 * - Tokens crm-v2 ficam disponíveis dentro do portal (className `crm-workspace`).
 * - Single-section view: o consumer renderiza apenas a seção ativa no Body.
 * - Sem efeito sobre Activities domain, DnD, pipelineOrder, APIs ou React Query.
 *
 * Estrutura esperada pelo Root:
 *
 *   <EntitySheetShell ...>
 *     <EntitySheetShell.Header>...</EntitySheetShell.Header>
 *     <EntitySheetShell.Rail>
 *       <EntitySheetShell.RailItem id="overview" icon={...}>Visão geral</EntitySheetShell.RailItem>
 *       ...
 *     </EntitySheetShell.Rail>
 *     <EntitySheetShell.Body>
 *       {activeSection === "overview" ? <OverviewSection /> : null}
 *       ...
 *     </EntitySheetShell.Body>
 *   </EntitySheetShell>
 */
export const EntitySheetShell =
  EntitySheetShellRoot as EntitySheetShellComponent
EntitySheetShell.Header = EntitySheetShellHeader
EntitySheetShell.Rail = EntitySheetShellRail
EntitySheetShell.RailItem = EntitySheetShellRailItem
EntitySheetShell.Body = EntitySheetShellBody
