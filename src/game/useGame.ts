import { useCallback, useEffect, useRef, useState } from 'react'
import { CHAPTERS } from './chapters'
import { MODULES, MONSTERS } from './defs'
import { speakWord } from './speak'
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
  distToSegment,
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
    const compact =
      typeof window !== 'undefined' &&
      (window.matchMedia('(max-width: 900px)').matches || window.innerHeight < 780)
    const round = pickMatchRound(lvl.words, compact ? 3 : 4)
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
    let lastUi = 0

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
          m.speed = slowed ? m.baseSpeed * (MODULES.snare.slowFactor ?? 0.5) : m.baseSpeed
          m.progress += m.speed * dt

          const pos = positionOnPath(lvl.path, m.progress)
          if (pos.finished || m.progress >= lvl.path.length - 1) {
            const leak = MONSTERS[m.kind].leakDamage
            s.lives = Math.max(0, s.lives - leak)
            s.floaters.push({
              id: uid('f'),
              x: pos.x,
              y: pos.y,
              text: `?? -${leak}`,
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
          if (proj.kind === 'pulse' || proj.kind === 'blast') {
            const maxR = proj.maxRadius ?? 1.2
            proj.radius = (proj.radius ?? 0) + dt * (proj.kind === 'blast' ? 4.2 : 3.4)
            if (!proj.pulseApplied && (proj.radius ?? 0) >= maxR * 0.42) {
              proj.pulseApplied = true
              const slowMs = (MODULES.snare.slowDuration ?? 1.25) * 1000
              for (const m of [...s.monsters]) {
                const p = positionOnPath(lvl.path, m.progress)
                if (distance(proj.fromX, proj.fromY, p.x, p.y) <= maxR) {
                  if (proj.kind === 'pulse') {
                    m.slowUntil = now + slowMs
                  }
                  if (proj.kind === 'blast' || proj.blastDamage) {
                    applyDamage(s, m.id, proj.damage, p.x, p.y, proj.color, now)
                  }
                }
              }
            }

            if ((proj.radius ?? 0) < maxR) nextProjectiles.push(proj)
            else {
              s.impacts.push({
                id: uid('fx'),
                x: proj.fromX,
                y: proj.fromY,
                kind: proj.kind,
                color: proj.color,
                bornAt: now,
              })
            }
            continue
          }

          if (proj.kind === 'beam' || proj.kind === 'arc') {
            proj.life = (proj.life ?? 0.2) - dt
            if ((proj.life ?? 0) > 0) nextProjectiles.push(proj)
            else {
              s.impacts.push({
                id: uid('fx'),
                x: proj.toX,
                y: proj.toY,
                kind: proj.kind,
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

        // Module attacks — spawn projectiles / instant effects
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

          mod.fireUntil = now + 220
          mod.cooldownLeft = def.cooldown
          const fxColor = CHAPTERS[lvl.chapter].modules[mod.kind].color

          if (mod.kind === 'snare') {
            s.projectiles.push({
              id: uid('p'),
              kind: 'pulse',
              moduleKind: 'snare',
              x: mx,
              y: my,
              fromX: mx,
              fromY: my,
              toX: mx,
              toY: my,
              speed: 0,
              damage: 0,
              targetId: null,
              color: fxColor,
              radius: 0.1,
              maxRadius: def.range,
              pulseApplied: false,
            })
            continue
          }

          if (mod.kind === 'stamp') {
            s.projectiles.push({
              id: uid('p'),
              kind: 'blast',
              moduleKind: 'stamp',
              x: mx,
              y: my,
              fromX: mx,
              fromY: my,
              toX: mx,
              toY: my,
              speed: 0,
              damage: def.damage,
              targetId: null,
              color: fxColor,
              radius: 0.08,
              maxRadius: def.range,
              pulseApplied: false,
              blastDamage: true,
            })
            continue
          }

          const primary = inRange[0]

          if (mod.kind === 'beam') {
            const reach = def.range
            const dx = primary.p.x - mx
            const dy = primary.p.y - my
            const len = Math.hypot(dx, dy) || 1
            const ex = mx + (dx / len) * reach
            const ey = my + (dy / len) * reach
            const halfW = def.beamWidth ?? 0.28
            for (const { m, p } of inRange) {
              if (distToSegment(p.x, p.y, mx, my, ex, ey) <= halfW) {
                applyDamage(s, m.id, def.damage, p.x, p.y, fxColor, now)
              }
            }
            s.projectiles.push({
              id: uid('p'),
              kind: 'beam',
              moduleKind: 'beam',
              x: mx,
              y: my,
              fromX: mx,
              fromY: my,
              toX: ex,
              toY: ey,
              speed: 0,
              damage: 0,
              targetId: null,
              color: fxColor,
              life: 0.22,
            })
            continue
          }

          if (mod.kind === 'chain') {
            const jumps = def.chainJumps ?? 3
            const jumpR = def.chainRange ?? 1.55
            const hit = new Set<string>()
            let cur = primary
            let fromX = mx
            let fromY = my
            let dmg = def.damage
            for (let i = 0; i <= jumps; i += 1) {
              if (!cur || hit.has(cur.m.id)) break
              hit.add(cur.m.id)
              applyDamage(s, cur.m.id, Math.max(4, Math.round(dmg)), cur.p.x, cur.p.y, fxColor, now)
              s.projectiles.push({
                id: uid('p'),
                kind: 'arc',
                moduleKind: 'chain',
                x: fromX,
                y: fromY,
                fromX,
                fromY,
                toX: cur.p.x,
                toY: cur.p.y,
                speed: 0,
                damage: 0,
                targetId: null,
                color: fxColor,
                life: 0.16 + i * 0.03,
              })
              fromX = cur.p.x
              fromY = cur.p.y
              dmg *= 0.72
              const next = s.monsters
                .map((m) => {
                  const p = positionOnPath(lvl.path, m.progress)
                  return { m, p, d: distance(fromX, fromY, p.x, p.y) }
                })
                .filter((x) => !hit.has(x.m.id) && x.d <= jumpR)
                .sort((a, b) => a.d - b.d)[0]
              cur = next
            }
            continue
          }

          const projKind = mod.kind === 'spore' ? 'cloud' : 'dart'
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
            speed: mod.kind === 'spore' ? 2.35 : 3.15,
            damage: def.damage,
            aoe: def.aoe,
            targetId: primary.m.id,
            color: fxColor,
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

      // 逻辑 60fps，界面约 30fps，减少 React 重绘卡顿
      if (now - lastUi >= 33 || s.phase === 'won' || s.phase === 'lost') {
        lastUi = now
        setTick((n) => n + 1)
      }
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
    (col: number, row: number, kind?: ModuleKind | null) => {
      const s = stateRef.current
      const lvl = level
      const placeKind = kind ?? s.selectedModule
      if (!placeKind) return
      if (s.phase === 'lost' || s.phase === 'won') return
      if (!lvl.buildable.some((p) => p.x === col && p.y === row)) return
      if (s.modules.some((m) => m.col === col && m.row === row)) return

      const def = MODULES[placeKind]
      if (s.gold < def.cost) return

      s.gold -= def.cost
      s.modules.push({
        id: uid('mod'),
        kind: placeKind,
        col,
        row,
        cooldownLeft: 0.2,
        fireUntil: 0,
      })
      s.selectedModule = placeKind
      setTick((n) => n + 1)
    },
    [level.id],
  )

  const selectWord = useCallback(
    (wordId: string) => {
      const s = stateRef.current
      if (s.matchedIds.has(wordId)) return
      if (s.matchFeedback === 'bad') return

      s.selectedWordId = wordId
      const pair = s.matchRound.words.find((w) => w.id === wordId)
      if (pair) void speakWord(pair.word)
      setTick((n) => n + 1)
    },
    [],
  )

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
    maxLives: level.lives,
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
