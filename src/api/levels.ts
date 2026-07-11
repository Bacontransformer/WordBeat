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

export async function fetchLevelSummaries(): Promise<LevelSummary[]> {
  const res = await fetch('/api/levels')
  if (!res.ok) throw new Error(`加载关卡列表失败 (${res.status})`)
  return res.json()
}

export async function fetchLevelDetail(id: string): Promise<LevelDef> {
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
