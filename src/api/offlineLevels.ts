import type { LevelDef, ModuleKind, Wave, WordPair } from '../game/types'
import { neighborsOfPath } from '../game/mapUtils'
import levelsData from '../data/offline/levels.json'
import packsData from '../data/offline/packs.json'

export type OfflineLevelSummary = {
  id: string
  name: string
  subtitle: string
  pack_slug: string
  pack_name: string
}

type OfflineLevel = {
  id: string
  name: string
  subtitle: string
  cols: number
  rows: number
  startGold: number
  lives: number
  pack: string
  pack_slug: string
  pack_name: string
  unlockedModules: ModuleKind[]
  path: { x: number; y: number }[]
  waves: Wave[]
}

type OfflinePack = {
  slug: string
  name: string
  source: string
  words: { word: string; meaning: string }[]
}

const levels = levelsData as OfflineLevel[]
const packs = packsData as Record<string, OfflinePack>

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function sampleWords(packSlug: string, limit: number): WordPair[] {
  const pack = packs[packSlug]
  if (!pack?.words?.length) return []
  return shuffle(pack.words)
    .slice(0, limit)
    .map((w, i) => ({
      id: `${packSlug}-${w.word}-${i}`,
      word: w.word,
      meaning: w.meaning,
    }))
}

export function fetchOfflineLevelSummaries(): OfflineLevelSummary[] {
  return levels.map((level) => ({
    id: level.id,
    name: level.name,
    subtitle: level.subtitle,
    pack_slug: level.pack_slug,
    pack_name: level.pack_name,
  }))
}

export function fetchOfflineLevelDetail(id: string, wordCount = 80): LevelDef {
  const level = levels.find((l) => l.id === id)
  if (!level) throw new Error(`关卡不存在: ${id}`)

  return {
    id: level.id,
    name: level.name,
    subtitle: level.subtitle,
    cols: level.cols,
    rows: level.rows,
    path: level.path,
    buildable: neighborsOfPath(level.path, level.cols, level.rows),
    startGold: level.startGold,
    lives: level.lives,
    waves: level.waves,
    words: sampleWords(level.pack, wordCount),
    unlockedModules: level.unlockedModules,
  }
}
