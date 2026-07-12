import type { LevelDef, Monster, Point } from './types'
import { curvedPositionOnPath } from './pathCurve'

/** progress 0..path.length-1 along smooth curve through cell centers */
export function positionOnPath(
  path: Point[],
  progress: number,
): { x: number; y: number; finished: boolean; angle: number } {
  return curvedPositionOnPath(path, progress)
}

export function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx
  const dy = ay - by
  return Math.hypot(dx, dy)
}

/** Distance from point P to segment AB */
export function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax
  const aby = by - ay
  const apx = px - ax
  const apy = py - ay
  const ab2 = abx * abx + aby * aby
  if (ab2 < 1e-8) return Math.hypot(apx, apy)
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2))
  return Math.hypot(px - (ax + t * abx), py - (ay + t * aby))
}

export function cellKey(col: number, row: number): string {
  return `${col},${row}`
}

export function isBuildable(level: LevelDef, col: number, row: number): boolean {
  return level.buildable.some((p) => p.x === col && p.y === row)
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pickMatchRound(words: LevelDef['words'], count = 4) {
  const pool = shuffle(words).slice(0, Math.min(count, words.length))
  return {
    words: shuffle(pool),
    meanings: shuffle(pool.map((w) => ({ id: w.id, meaning: w.meaning }))),
  }
}

let idCounter = 0
export function uid(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

export function createMonster(
  kind: Monster['kind'],
  defs: { hp: number; speed: number; reward: number },
): Monster {
  return {
    id: uid('m'),
    kind,
    hp: defs.hp,
    maxHp: defs.hp,
    speed: defs.speed,
    baseSpeed: defs.speed,
    progress: 0,
    slowUntil: 0,
    slowFactor: 0.5,
    reward: defs.reward,
  }
}
