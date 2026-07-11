import type { LevelDef, ModuleKind, WordPair } from '../game/types'

export type LevelSummary = {
  id: string
  name: string
  subtitle: string
  pack_slug: string
  pack_name: string
}

type ApiLevelDetail = {
  id: string
  name: string
  subtitle: string
  cols: number
  rows: number
  startGold: number
  lives: number
  path: { x: number; y: number }[]
  buildable: { x: number; y: number }[]
  unlockedModules: ModuleKind[]
  waves: LevelDef['waves']
  words: WordPair[]
}

const isOffline = import.meta.env.VITE_DATA_MODE === 'offline'

export async function fetchLevelSummaries(): Promise<LevelSummary[]> {
  if (isOffline) {
    const { fetchOfflineLevelSummaries } = await import('./offlineLevels')
    return fetchOfflineLevelSummaries()
  }
  const res = await fetch('/api/levels')
  if (!res.ok) throw new Error(`加载关卡列表失败 (${res.status})`)
  return res.json()
}

export async function fetchLevelDetail(id: string): Promise<LevelDef> {
  if (isOffline) {
    const { fetchOfflineLevelDetail } = await import('./offlineLevels')
    return fetchOfflineLevelDetail(id, 80)
  }
  const res = await fetch(`/api/levels/${id}?words=80`)
  if (!res.ok) throw new Error(`加载关卡失败 (${res.status})`)
  const data = (await res.json()) as ApiLevelDetail
  return {
    id: data.id,
    name: data.name,
    subtitle: data.subtitle,
    cols: data.cols,
    rows: data.rows,
    path: data.path,
    buildable: data.buildable,
    startGold: data.startGold,
    lives: data.lives,
    waves: data.waves,
    words: data.words,
    unlockedModules: data.unlockedModules,
  }
}
