const PLAYER_KEY = 'wordbeat.playerId'
const LOCAL_PROGRESS_KEY = 'wordbeat.progress.v1'

const isOffline = import.meta.env.VITE_DATA_MODE === 'offline'

export type ProgressState = {
  clearedIds: string[]
}

export type LevelProgressMeta = {
  id: string
  chapter: string
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

const CHAPTER_ORDER = ['jungle', 'ocean', 'sky'] as const

/** Chapter fully cleared → unlock next chapter; within chapter unlock sequentially. */
export function getLevelAccess(levels: LevelProgressMeta[], clearedIds: string[]) {
  const cleared = new Set(clearedIds)
  const unlocked = new Set<string>()
  let frontierId: string | null = null

  for (let ci = 0; ci < CHAPTER_ORDER.length; ci += 1) {
    const chapter = CHAPTER_ORDER[ci]
    const chapterLevels = levels.filter((l) => l.chapter === chapter)
    if (!chapterLevels.length) continue

    const prevChapter = ci === 0 ? null : CHAPTER_ORDER[ci - 1]
    const prevLevels = prevChapter ? levels.filter((l) => l.chapter === prevChapter) : []
    const chapterOpen =
      ci === 0 || (prevLevels.length > 0 && prevLevels.every((l) => cleared.has(l.id)))

    if (!chapterOpen) continue

    for (let i = 0; i < chapterLevels.length; i += 1) {
      const id = chapterLevels[i].id
      const open = i === 0 || cleared.has(chapterLevels[i - 1].id)
      if (!open) break
      unlocked.add(id)
      if (!cleared.has(id) && frontierId === null) frontierId = id
    }
  }

  if (frontierId === null && levels.length) {
    frontierId = levels[levels.length - 1].id
  }

  return { unlocked, frontierId, cleared }
}

export function getNextLevelId(
  levels: LevelProgressMeta[],
  currentId: string,
  clearedIds: string[],
): string | null {
  const access = getLevelAccess(levels, clearedIds)
  const idx = levels.findIndex((l) => l.id === currentId)
  if (idx < 0) return null
  for (let i = idx + 1; i < levels.length; i += 1) {
    if (access.unlocked.has(levels[i].id)) return levels[i].id
  }
  return null
}
