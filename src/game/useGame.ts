import { useCallback, useEffect, useRef, useState } from 'react'
import { MODULES, MONSTERS } from './defs'
import type {
  FloatingText,
  GamePhase,
  GameSnapshot,
  ImpactFx,
  LevelDef,
  MatchRound,
  ModuleKind,
  Monster,
  PlacedModule,
  Projectile,
} from './types'
import {
  createMonster,
  distance,
  pickMatchRound,
  positionOnPath,
  uid,
} from './utils'

export type { GameSnapshot }

type SpawnJob = {
  kind: Monster['kind']
  remaining: number
  interval: number
  nextAt: number
}

type GameState = {
  phase: GamePhase
  gold: number
  lives: number
  waveIndex: number
  combo: number
  monsters: Monster[]
  modules: PlacedModule[]
  projectiles: Projectile[]
  impacts: ImpactFx[]
  floaters: FloatingText[]
  selectedModule: ModuleKind | null
  matchRound: MatchRound
  selectedWordId: string | null
  matchedIds: Set<string>
  matchFeedback: 'ok' | 'bad' | null
  feedbackUntil: number
  preparingLeft: number
  elapsed: number
  waveTimer: number
  spawnJobs: SpawnJob[]
  wavesDone: boolean
  allSpawned: boolean
}

function emptyMatch(): MatchRound {
  return { words: [], meanings: [] }
}

function applyDamage(
  s: GameState,
  monsterId: string,
  damage: number,
  x: number,
  y: number,
  color: string,
  now: number,
) {
  const target = s.monsters.find((m) => m.id === monsterId)
  if (!target || target.hp <= 0) return

  target.hp -= damage
  s.floaters.push({
    id: uid('f'),
    x,
    y,
    text: `-${damage}`,
    color,
    bornAt: now,
  })

  if (target.hp <= 0) {
    s.gold += target.reward
    s.monsters = s.monsters.filter((m) => m.id !== target.id)
  }
}

export function useGame(level: LevelDef) {
  const [tick, setTick] = useState(0)

  const stateRef = useRef<GameState>({
    phase: 'ready',
    gold: level.startGold,
    lives: level.lives,
    waveIndex: -1,
    combo: 0,
    monsters: [],
    modules: [],
    projectiles: [],
    impacts: [],
    floaters: [],
    selectedModule: null,
    matchRound: emptyMatch(),
    selectedWordId: null,
    matchedIds: new Set(),
    matchFeedback: null,
    feedbackUntil: 0,
    preparingLeft: 3,
    elapsed: 0,
    waveTimer: 0,
    spawnJobs: [],
    wavesDone: false,
    allSpawned: false,
  })

  const refreshMatch = useCallback((lvl: LevelDef) => {
    const round = pickMatchRound(lvl.words, 4)
    stateRef.current.matchRound = round
    stateRef.current.selectedWordId = null
    stateRef.current.matchedIds = new Set()
  }, [])

  const reset = useCallback(() => {
    const lvl = level
    stateRef.current = {
      phase: 'ready',
      gold: lvl.startGold,
      lives: lvl.lives,
      waveIndex: -1,
      combo: 0,
      monsters: [],
      modules: [],
      projectiles: [],
      impacts: [],
      floaters: [],
      selectedModule: null,
      matchRound: emptyMatch(),
      selectedWordId: null,
      matchedIds: new Set(),
      matchFeedback: null,
      feedbackUntil: 0,
      preparingLeft: 3,
      elapsed: 0,
      waveTimer: 0,
      spawnJobs: [],
      wavesDone: false,
      allSpawned: false,
    }
    refreshMatch(lvl)
    setTick((t) => t + 1)
  }, [level, refreshMatch])

  useEffect(() => {
    reset()
  }, [reset])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = stateRef.current
      const lvl = level

      if (s.matchFeedback && now > s.feedbackUntil) {
        s.matchFeedback = null
      }

      s.floaters = s.floaters.filter((f) => now - f.bornAt < 900)
      s.impacts = s.impacts.filter((f) => now - f.bornAt < 420)

      if (s.phase === 'ready') {
        s.preparingLeft = Math.max(0, s.preparingLeft - dt)
        if (s.preparingLeft <= 0) {
          s.phase = 'playing'
          s.waveIndex = 0
          s.waveTimer = lvl.waves[0]?.delay ?? 0
          s.spawnJobs = []
          s.wavesDone = false
          s.allSpawned = false
        }
      }

      if (s.phase === 'playing') {
        s.elapsed += dt

        if (!s.wavesDone) {
          if (s.spawnJobs.length === 0) {
            s.waveTimer -= dt
            if (s.waveTimer <= 0) {
              const wave = lvl.waves[s.waveIndex]
              if (wave) {
                s.spawnJobs = wave.spawns.map((sp) => ({
                  kind: sp.kind,
                  remaining: sp.count,
                  interval: sp.interval,
                  nextAt: s.elapsed,
                }))
              }
            }
          } else {
            for (const job of s.spawnJobs) {
              if (job.remaining <= 0) continue
              if (s.elapsed >= job.nextAt) {
                const def = MONSTERS[job.kind]
                s.monsters.push(createMonster(job.kind, def))
                job.remaining -= 1
                job.nextAt = s.elapsed + job.interval
              }
            }
            if (s.spawnJobs.every((j) => j.remaining <= 0)) {
              s.spawnJobs = []
              if (s.waveIndex >= lvl.waves.length - 1) {
                s.wavesDone = true
                s.allSpawned = true
              } else {
                s.waveIndex += 1
                s.waveTimer = lvl.waves[s.waveIndex].delay
              }
            }
          }
        }

        const survivors: Monster[] = []
        for (const m of s.monsters) {
          const slowed = now < m.slowUntil
          m.speed = slowed ? m.baseSpeed * (MODULES.slow.slowFactor ?? 0.52) : m.baseSpeed
          m.progress += m.speed * dt

          const pos = positionOnPath(lvl.path, m.progress)
          if (pos.finished || m.progress >= lvl.path.length - 1) {
            s.lives -= 1
            s.floaters.push({
              id: uid('f'),
              x: pos.x,
              y: pos.y,
              text: '??!',
              color: '#c45c3e',
              bornAt: now,
            })
            if (s.lives <= 0) {
              s.phase = 'lost'
            }
            continue
          }
          if (m.hp > 0) survivors.push(m)
        }
        s.monsters = survivors

        // Update projectiles
        const nextProjectiles: Projectile[] = []
        for (const proj of s.projectiles) {
          if (proj.kind === 'pulse') {
            const maxR = proj.maxRadius ?? 1.2
            proj.radius = (proj.radius ?? 0) + dt * 3.4
            if (!proj.pulseApplied && (proj.radius ?? 0) >= maxR * 0.45) {
              proj.pulseApplied = true
              for (const m of s.monsters) {
                const p = positionOnPath(lvl.path, m.progress)
                if (distance(proj.fromX, proj.fromY, p.x, p.y) <= maxR) {
                  m.slowUntil = now + 1400
                }
              }
            }

            if ((proj.radius ?? 0) < maxR) nextProjectiles.push(proj)
            else {
              s.impacts.push({
                id: uid('fx'),
                x: proj.fromX,
                y: proj.fromY,
                kind: 'pulse',
                color: proj.color,
                bornAt: now,
              })
            }
            continue
          }

          if (proj.targetId) {
            const live = s.monsters.find((m) => m.id === proj.targetId)
            if (live) {
              const p = positionOnPath(lvl.path, live.progress)
              proj.toX = p.x
              proj.toY = p.y
            }
          }

          const dx = proj.toX - proj.x
          const dy = proj.toY - proj.y
          const dist = Math.hypot(dx, dy)
          const step = proj.speed * dt

          if (dist <= Math.max(0.08, step)) {
            proj.x = proj.toX
            proj.y = proj.toY

            s.impacts.push({
              id: uid('fx'),
              x: proj.x,
              y: proj.y,
              kind: proj.kind,
              color: proj.color,
              bornAt: now,
            })

            if (proj.aoe != null) {
              for (const m of [...s.monsters]) {
                const p = positionOnPath(lvl.path, m.progress)
                if (distance(proj.x, proj.y, p.x, p.y) <= proj.aoe) {
                  applyDamage(s, m.id, proj.damage, p.x, p.y, proj.color, now)
                }
              }
            } else if (proj.targetId) {
              applyDamage(s, proj.targetId, proj.damage, proj.x, proj.y, proj.color, now)
            }
            continue
          }

          proj.x += (dx / dist) * step
          proj.y += (dy / dist) * step
          nextProjectiles.push(proj)
        }
        s.projectiles = nextProjectiles

        // Module attacks ??spawn projectiles
        for (const mod of s.modules) {
          mod.cooldownLeft = Math.max(0, mod.cooldownLeft - dt)
          if (mod.cooldownLeft > 0) continue
          const def = MODULES[mod.kind]
          const mx = mod.col + 0.5
          const my = mod.row + 0.5

          const inRange = s.monsters
            .map((m) => {
              const p = positionOnPath(lvl.path, m.progress)
              return { m, p, d: distance(mx, my, p.x, p.y) }
            })
            .filter((x) => x.d <= def.range)
            .sort((a, b) => b.m.progress - a.m.progress)

          if (inRange.length === 0) continue

          mod.fireUntil = now + 180
          mod.cooldownLeft = def.cooldown

          if (mod.kind === 'slow') {
            s.projectiles.push({
              id: uid('p'),
              kind: 'pulse',
              moduleKind: 'slow',
              x: mx,
              y: my,
              fromX: mx,
              fromY: my,
              toX: mx,
              toY: my,
              speed: 0,
              damage: 0,
              targetId: null,
              color: def.color,
              radius: 0.12,
              maxRadius: def.range,
              pulseApplied: false,
            })
            continue
          }

          const primary = inRange[0]
          const projKind = mod.kind === 'spray' ? 'mist' : 'card'
          s.projectiles.push({
            id: uid('p'),
            kind: projKind,
            moduleKind: mod.kind,
            x: mx,
            y: my,
            fromX: mx,
            fromY: my,
            toX: primary.p.x,
            toY: primary.p.y,
            speed: mod.kind === 'spray' ? 2.4 : 2.8,
            damage: def.damage,
            aoe: def.aoe,
            targetId: primary.m.id,
            color: def.color,
          })
        }

        if (
          s.allSpawned &&
          s.monsters.length === 0 &&
          s.projectiles.length === 0 &&
          s.phase === 'playing'
        ) {
          s.phase = 'won'
        }
      }

      setTick((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [level.id])

  const selectModule = useCallback((kind: ModuleKind | null) => {
    stateRef.current.selectedModule = kind
    setTick((n) => n + 1)
  }, [])

  const placeModule = useCallback(
    (col: number, row: number) => {
      const s = stateRef.current
      const lvl = level
      if (!s.selectedModule) return
      if (s.phase === 'lost' || s.phase === 'won') return
      if (!lvl.buildable.some((p) => p.x === col && p.y === row)) return
      if (s.modules.some((m) => m.col === col && m.row === row)) return

      const def = MODULES[s.selectedModule]
      if (s.gold < def.cost) return

      s.gold -= def.cost
      s.modules.push({
        id: uid('mod'),
        kind: s.selectedModule,
        col,
        row,
        cooldownLeft: 0.2,
        fireUntil: 0,
      })
      setTick((n) => n + 1)
    },
    [level.id],
  )

  const selectWord = useCallback((wordId: string) => {
    const s = stateRef.current
    if (s.matchedIds.has(wordId)) return
    if (s.matchFeedback === 'bad') return
    s.selectedWordId = s.selectedWordId === wordId ? null : wordId
    setTick((n) => n + 1)
  }, [])

  const selectMeaning = useCallback(
    (meaningId: string) => {
      const s = stateRef.current
      const lvl = level
      if (!s.selectedWordId) return
      if (s.matchedIds.has(meaningId)) return
      if (s.matchFeedback === 'bad') return

      const now = performance.now()
      if (s.selectedWordId === meaningId) {
        s.matchedIds.add(meaningId)
        s.combo += 1
        const mult = Math.min(2, 1 + (s.combo - 1) * 0.2)
        const gain = Math.round(9 * mult)
        s.gold += gain
        s.matchFeedback = 'ok'
        s.feedbackUntil = now + 350
        s.selectedWordId = null
        s.floaters.push({
          id: uid('f'),
          x: lvl.cols / 2,
          y: 0.3,
          text: `+${gain} ?`,
          color: '#b8860b',
          bornAt: now,
        })

        if (s.matchedIds.size >= s.matchRound.words.length) {
          setTimeout(() => {
            refreshMatch(lvl)
            setTick((n) => n + 1)
          }, 280)
        }
      } else {
        s.combo = 0
        s.matchFeedback = 'bad'
        s.feedbackUntil = now + 500
        s.selectedWordId = null
      }
      setTick((n) => n + 1)
    },
    [level, refreshMatch],
  )

  const s = stateRef.current
  const firingModuleIds = new Set(
    s.modules.filter((m) => s && performance.now() < m.fireUntil).map((m) => m.id),
  )

  const snapshot: GameSnapshot = {
    phase: s.phase,
    gold: s.gold,
    lives: s.lives,
    waveIndex: Math.max(0, s.waveIndex),
    waveTotal: level.waves.length,
    combo: s.combo,
    monsters: s.monsters,
    modules: s.modules,
    projectiles: s.projectiles,
    impacts: s.impacts,
    floaters: s.floaters,
    selectedModule: s.selectedModule,
    matchRound: s.matchRound,
    selectedWordId: s.selectedWordId,
    matchedIds: s.matchedIds,
    matchFeedback: s.matchFeedback,
    preparingLeft: s.preparingLeft,
    now: performance.now(),
    firingModuleIds,
  }

  void tick

  return {
    level,
    snapshot,
    selectModule,
    placeModule,
    selectWord,
    selectMeaning,
    reset,
  }
}
