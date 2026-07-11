import { useMemo } from 'react'
import { MODULES, MONSTERS } from '../game/defs'
import { pathToSmoothSvgD } from '../game/pathCurve'
import { MODULE_SPRITE, MONSTER_SPRITE, PROJECTILE_SPRITE } from '../game/sprites'
import type { GameSnapshot, LevelDef, ModuleKind, Projectile } from '../game/types'
import { cellKey, positionOnPath } from '../game/utils'

type Props = {
  level: LevelDef
  snapshot: GameSnapshot
  onPlace: (col: number, row: number, kind?: ModuleKind | null) => void
  /** While dragging a module from the bar, highlight buildable cells */
  draggingKind?: ModuleKind | null
}

function projectilePos(proj: Projectile) {
  return { x: proj.x, y: proj.y }
}

function projectileAngle(proj: Projectile) {
  return (Math.atan2(proj.toY - proj.y, proj.toX - proj.x) * 180) / Math.PI
}

export function BattleMap({ level, snapshot, onPlace, draggingKind = null }: Props) {
  const pathSet = new Set(level.path.map((p) => cellKey(p.x, p.y)))
  const buildSet = new Set(level.buildable.map((p) => cellKey(p.x, p.y)))
  const occupied = new Set(snapshot.modules.map((m) => cellKey(m.col, m.row)))
  const start = level.path[0]
  const end = level.path[level.path.length - 1]
  const baseHpRatio = snapshot.maxLives > 0 ? snapshot.lives / snapshot.maxLives : 0
  const placingKind = draggingKind ?? snapshot.selectedModule

  const cellW = 100 / level.cols
  const cellH = 100 / level.rows

  const pathD = useMemo(() => pathToSmoothSvgD(level.path), [level.path])
  const startCenter = { x: start.x + 0.5, y: start.y + 0.5 }
  const endCenter = { x: end.x + 0.5, y: end.y + 0.5 }

  return (
    <div
      className={`battle-map${draggingKind ? ' battle-map-drop-active' : ''}`}
      style={{ aspectRatio: `${level.cols} / ${level.rows}` }}
    >
      <div className="map-atmosphere" aria-hidden>
        <span className="ink-blot blot-a" />
        <span className="ink-blot blot-b" />
        <span className="ink-blot blot-c" />
        <span className="margin-doodle" />
      </div>

      <svg
        className="path-layer"
        viewBox={`0 0 ${level.cols} ${level.rows}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="pathFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8b4a4" />
            <stop offset="45%" stopColor="#d98972" />
            <stop offset="100%" stopColor="#c45c3e" />
          </linearGradient>
          <filter id="pathSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.04" />
          </filter>
        </defs>

        {/* soft ground wash under path */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(196, 92, 62, 0.14)"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#pathSoft)"
        />
        {/* main ribbon */}
        <path
          d={pathD}
          className="path-ribbon"
          fill="none"
          stroke="url(#pathFill)"
          strokeWidth="0.72"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* paper edge highlight */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255, 250, 240, 0.45)"
          strokeWidth="0.28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* dashed ink guide */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(28, 43, 36, 0.28)"
          strokeWidth="0.06"
          strokeLinecap="round"
          strokeDasharray="0.18 0.16"
        />

        {/* start gate */}
        <g className="path-marker start-marker" transform={`translate(${startCenter.x} ${startCenter.y})`}>
          <circle r="0.42" fill="#1c2b24" opacity="0.12" />
          <circle r="0.28" fill="#2f6b4f" />
          <circle r="0.12" fill="#f7f1e4" />
        </g>

        {/* end textbook */}
        <g className="path-marker end-marker" transform={`translate(${endCenter.x} ${endCenter.y})`}>
          <rect x="-0.34" y="-0.4" width="0.68" height="0.8" rx="0.06" fill="#f7f1e4" stroke="#c45c3e" strokeWidth="0.07" />
          <rect x="-0.22" y="-0.26" width="0.44" height="0.08" rx="0.02" fill="#c45c3e" />
          <rect x="-0.22" y="-0.08" width="0.34" height="0.05" rx="0.01" fill="#1c2b24" opacity="0.25" />
          <rect x="-0.22" y="0.05" width="0.3" height="0.05" rx="0.01" fill="#1c2b24" opacity="0.18" />
          <rect x="-0.32" y="0.48" width="0.64" height="0.1" rx="0.03" fill="#1c2b24" opacity="0.35" />
          <rect
            x="-0.3"
            y="0.5"
            width={0.6 * Math.max(0, baseHpRatio)}
            height="0.06"
            rx="0.02"
            fill={baseHpRatio > 0.35 ? '#2f6b4f' : '#c45c3e'}
          />
        </g>
      </svg>

      <div
        className="battle-grid"
        style={{
          gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
          gridTemplateRows: `repeat(${level.rows}, 1fr)`,
        }}
      >
        {Array.from({ length: level.rows }, (_, row) =>
          Array.from({ length: level.cols }, (_, col) => {
            const key = cellKey(col, row)
            const isPath = pathSet.has(key)
            const isBuild = buildSet.has(key)
            const isEnd = end.x === col && end.y === row
            const isStart = start.x === col && start.y === row
            const canPlace =
              Boolean(placingKind) &&
              isBuild &&
              !occupied.has(key) &&
              snapshot.phase !== 'won' &&
              snapshot.phase !== 'lost'

            return (
              <button
                key={key}
                type="button"
                data-cell-col={col}
                data-cell-row={row}
                className={[
                  'cell',
                  isPath ? 'cell-path' : '',
                  isBuild ? 'cell-build' : '',
                  isEnd ? 'cell-end' : '',
                  isStart ? 'cell-start' : '',
                  canPlace ? 'cell-placeable' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => canPlace && onPlace(col, row)}
                disabled={!canPlace}
                aria-label={
                  isEnd ? '终点课本' : isStart ? '起点' : isBuild ? `可建造 ${col},${row}` : `格子 ${col},${row}`
                }
              >
                {isStart && <span className="cell-label">起点</span>}
                {isEnd && (
                  <span className="cell-label end-label">
                    课本 {snapshot.lives}
                  </span>
                )}
                {canPlace && <span className="place-hint" />}
              </button>
            )
          }),
        )}
      </div>

      <div className="battle-entities">
        {snapshot.modules.map((mod) => {
          const def = MODULES[mod.kind]
          const firing = snapshot.firingModuleIds.has(mod.id)
          return (
            <div
              key={mod.id}
              className={`entity module-entity${firing ? ' firing' : ''}`}
              style={{
                left: `${(mod.col + 0.5) * cellW}%`,
                top: `${(mod.row + 0.5) * cellH}%`,
                ['--mod' as string]: def.color,
              }}
              title={def.name}
            >
              <img src={MODULE_SPRITE[mod.kind]} alt={def.name} draggable={false} />
              {snapshot.selectedModule === mod.kind && (
                <span
                  className="range-ring"
                  style={{
                    width: `${def.range * 2 * cellW}%`,
                    height: `${def.range * 2 * cellH * (level.cols / level.rows)}%`,
                  }}
                />
              )}
              {firing && <span className="muzzle-flash" />}
            </div>
          )
        })}

        {snapshot.monsters.map((m) => {
          const pos = positionOnPath(level.path, m.progress)
          const def = MONSTERS[m.kind]
          const slowed = snapshot.now < m.slowUntil
          const deg = ((pos.angle ?? 0) * 180) / Math.PI
          return (
            <div
              key={m.id}
              className={`entity monster-entity${slowed ? ' slowed' : ''}`}
              style={{
                left: `${pos.x * cellW}%`,
                top: `${pos.y * cellH}%`,
                ['--face' as string]: `${deg}deg`,
              }}
              title={def.name}
            >
              <div className="hp-bar">
                <i style={{ width: `${Math.max(0, (m.hp / m.maxHp) * 100)}%` }} />
              </div>
              <img src={MONSTER_SPRITE[m.kind]} alt={def.name} draggable={false} />
            </div>
          )
        })}

        {snapshot.projectiles.map((proj) => {
          const pos = projectilePos(proj)
          if (proj.kind === 'pulse') {
            const r = (proj.radius ?? 0.2) * 2
            return (
              <div
                key={proj.id}
                className="entity pulse-ring"
                style={{
                  left: `${pos.x * cellW}%`,
                  top: `${pos.y * cellH}%`,
                  width: `${r * cellW}%`,
                  height: `${r * cellH * (level.cols / level.rows)}%`,
                  borderColor: proj.color,
                }}
              />
            )
          }

          const sprite = proj.kind === 'mist' ? PROJECTILE_SPRITE.mist : PROJECTILE_SPRITE.card
          return (
            <div
              key={proj.id}
              className={`entity projectile projectile-${proj.kind}`}
              style={{
                left: `${pos.x * cellW}%`,
                top: `${pos.y * cellH}%`,
                transform: `translate(-50%, -50%) rotate(${projectileAngle(proj)}deg)`,
              }}
            >
              <img src={sprite} alt="" draggable={false} />
            </div>
          )
        })}

        {snapshot.impacts.map((fx) => (
          <div
            key={fx.id}
            className={`entity impact impact-${fx.kind}`}
            style={{
              left: `${fx.x * cellW}%`,
              top: `${fx.y * cellH}%`,
              ['--fx' as string]: fx.color,
            }}
          />
        ))}

        {snapshot.floaters.map((f) => (
          <div
            key={f.id}
            className="floater"
            style={{
              left: `${f.x * cellW}%`,
              top: `${f.y * cellH}%`,
              color: f.color,
            }}
          >
            {f.text}
          </div>
        ))}
      </div>
    </div>
  )
}
