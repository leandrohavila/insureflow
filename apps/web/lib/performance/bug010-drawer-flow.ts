type Bug010DrawerMutationSnapshot = {
  status?: string
  isPending?: boolean
}

type Bug010DrawerState = Bug010DrawerMutationSnapshot & {
  dialogOpen?: boolean
  submitLocked?: boolean
}

export type Bug010DrawerEvent = {
  at: number
  event: string
  dialogOpen?: boolean
  submitLocked?: boolean
  mutationStatus?: string
  mutationIsPending?: boolean
}

type Bug010DrawerWindow = Window & {
  __BUG010_DRAWER_FLOW__?: {
    startedAt: number
    state: Bug010DrawerState
    events: Bug010DrawerEvent[]
  }
}

function drawerWindow() {
  if (typeof window === "undefined") return null
  return window as Bug010DrawerWindow
}

function drawerFlow() {
  const target = drawerWindow()
  if (!target) return null
  target.__BUG010_DRAWER_FLOW__ ??= {
    startedAt: performance.now(),
    state: {},
    events: [],
  }
  return target.__BUG010_DRAWER_FLOW__
}

export function bug010DrawerResetFlow() {
  const target = drawerWindow()
  if (!target) return
  target.__BUG010_DRAWER_FLOW__ = {
    startedAt: performance.now(),
    state: {},
    events: [],
  }
}

export function bug010DrawerSetState(state: Partial<Bug010DrawerState>) {
  const flow = drawerFlow()
  if (!flow) return
  flow.state = { ...flow.state, ...state }
}

export function bug010DrawerLog(
  event: string,
  mutation?: Bug010DrawerMutationSnapshot,
) {
  const flow = drawerFlow()
  if (!flow) return
  if (mutation) {
    flow.state = { ...flow.state, ...mutation }
  }
  const snapshot = flow.state
  const entry: Bug010DrawerEvent = {
    at: Number((performance.now() - flow.startedAt).toFixed(2)),
    event,
    dialogOpen: snapshot.dialogOpen,
    submitLocked: snapshot.submitLocked,
    mutationStatus: snapshot.status,
    mutationIsPending: snapshot.isPending,
  }
  flow.events.push(entry)
  console.log("[BUG010.6][drawer]", entry)
}

export function bug010DrawerTimeline() {
  return drawerFlow()?.events ?? []
}
