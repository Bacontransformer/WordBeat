const PLAYER_KEY = 'wordbeat.playerId'
const LOCAL_PROGRESS_KEY = 'wordbeat.progress.v1'

const isOffline = import.meta.env.VITE_DATA_MODE === 'offline'

export type ProgressState = {
  clearedIds: string[]
}

function randomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function getPlayerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_KEY)
    if (existing) return existing
    const id = randomId()
    localStorage.setItem(PLAYER_KEY, id)
    return id
  } catch {
    return 'local-anonymous'
  }
}

function readLocal(): ProgressState {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY)
    if (!raw) return { clearedIds: [] }
    const parsed = JSON.parse(raw) as ProgressState
    return { clearedIds: Array.isArray(parsed.clearedIds) ? parsed.clearedIds.map(String) : [] }
  } catch {
    return { clearedIds: [] }
  }
}

function writeLocal(state: ProgressState) {
  try {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

export async function fetchProgress(): Promise<ProgressState> {
  if (isOffline) {
    return readLocal()
  }

  const playerId = getPlayerId()
  try {
    const res = await fetch(`/api/progress/${encodeURIComponent(playerId)}`)
    if (!res.ok) throw new Error(`progress ${res.status}`)
    const data = (await res.json()) as { clearedIds?: string[] }
    const state = { clearedIds: (data.clearedIds ?? []).map(String) }
    writeLocal(state)
    return state
  } catch {
    // Fall back to local cache if API is down
    return readLocal()
  }
}

export async function markLevelCleared(levelId: string): Promise<ProgressState> {
  const current = await fetchProgress()
  if (current.clearedIds.includes(levelId)) return current
  const next = { clearedIds: [...current.clearedIds, levelId] }

  if (isOffline) {
    writeLocal(next)
    return next
  }

  writeLocal(next)
  const playerId = getPlayerId()
  try {
    const res = await fetch(`/api/progress/${encodeURIComponent(playerId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearedIds: next.clearedIds }),
    })
    if (!res.ok) throw new Error(`save ${res.status}`)
    const data = (await res.json()) as { clearedIds?: string[] }
    const saved = { clearedIds: (data.clearedIds ?? next.clearedIds).map(String) }
    writeLocal(saved)
    return saved
  } catch {
    return next
  }
}

/** First locked level index after sequential unlock; flag marks the frontier. */
export function getLevelAccess(levelIds: string[], clearedIds: string[]) {
  const cleared = new Set(clearedIds)
  let frontierId: string | null = null
  const unlocked = new Set<string>()

  for (let i = 0; i < levelIds.length; i += 1) {
    const id = levelIds[i]
    const open = i === 0 || cleared.has(levelIds[i - 1])
    if (open) {
      unlocked.add(id)
      if (!cleared.has(id) && frontierId === null) frontierId = id
    }
  }

  if (frontierId === null && levelIds.length) {
    // All cleared → flag on last
    frontierId = levelIds[levelIds.length - 1]
  }

  return { unlocked, frontierId, cleared }
}
