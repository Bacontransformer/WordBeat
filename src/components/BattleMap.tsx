import { memo, useMemo, type RefObject } from 'react'
import { MODULES } from '../game/defs'
import { CHAPTERS } from '../game/chapters'
import { pathToSmoothSvgD } from '../game/pathCurve'
import { moduleSprite, monsterSprite, projectileSprite } from '../game/sprites'
import type { GamePhase, GameSnapshot, LevelDef, ModuleKind, Projectile } from '../game/types'
import { cellKey, positionOnPath } from '../game/utils'

type Props = {
  level: LevelDef
  snapshot: GameSnapshot
  onPlace: (col: number, row: number, kind?: ModuleKind | null) => void
  draggingKind?: ModuleKind | null
  hoverCell?: { col: number; row: number } | null
  mapRef?: RefObject<HTMLDivElement | null>
}

function projectilePos(proj: Projectile) {
  return { x: proj.x, y: proj.y }
}

function projectileAngle(proj: Projectile) {
  return (Math.atan2(proj.toY - proj.y, proj.toX - proj.x) * 180) / Math.PI
}

type GridProps = {
  level: LevelDef
  occupiedKey: string
  placingKind: ModuleKind | null
  phase: GamePhase
  lives: number
  hoverCol: number | null
  hoverRow: number | null
  onPlace: (col: number, row: number, kind?: ModuleKind | null) => void
}

const BattleGrid = memo(function BattleGrid({
  level,
  occupiedKey,
  placingKind,
  phase,
  lives,
  hoverCol,
  hoverRow,
  onPlace,
}: GridProps) {
  const pathSet = useMemo(() => new Set(level.path.map((p) => cellKey(p.x, p.y))), [level.path])
  const buildSet = useMemo(
    () => new Set(level.buildable.map((p) => cellKey(p.x, p.y))),
    [level.buildable],
  )
  const occupied = useMemo(() => new Set(occupiedKey.split('|').filter(Boolean)), [occupiedKey])
  const start = level.path[0]
  const end = level.path[level.path.length - 1]

  return (
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
            Boolean(placingKind) && isBuild && !occupied.has(key) && phase !== 'won' && phase !== 'lost'
          const isHover = hoverCol === col && hoverRow === row && canPlace

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
                isHover ? 'cell-drop-hover' : '',
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
              {isEnd && <span className="cell-label end-label">课本 {lives}</span>}
              {canPlace && <span className="place-hint" />}
            </button>
          )
        }),
      )}
    </div>
  )
})

export function BattleMap({
  level,
  snapshot,
  onPlace,
  draggingKind = null,
  hoverCell = null,
  mapRef,
}: Props) {
  const start = level.path[0]
  const end = level.path[level.path.length - 1]
  const baseHpRatio = snapshot.maxLives > 0 ? snapshot.lives / snapshot.maxLives : 0
  const placingKind = draggingKind ?? snapshot.selectedModule
  const theme = CHAPTERS[level.chapter]
  const gradId = `pathFill-${level.chapter}`
  const occupiedKey = snapshot.modules.map((m) => cellKey(m.col, m.row)).join('|')

  const cellW = 100 / level.cols
  const cellH = 100 / level.rows

  const pathD = useMemo(() => pathToSmoothSvgD(level.path), [level.path])
  const startCenter = { x: start.x + 0.5, y: start.y + 0.5 }
  const endCenter = { x: end.x + 0.5, y: end.y + 0.5 }

  return (
    <div
      ref={mapRef}
      className={`battle-map chapter-${level.chapter}${draggingKind ? ' battle-map-drop-active' : ''}`}
      style={{
        aspectRatio: `${level.cols} / ${level.rows}`,
        background: `linear-gradient(180deg, ${theme.mapFrom} 0%, ${theme.mapTo} 100%)`,
        ['--accent' as string]: theme.accent,
        ['--map-cols' as string]: String(level.cols),
        ['--map-rows' as string]: String(level.rows),
      }}
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
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.mapFrom} />
            <stop offset="45%" stopColor={theme.accent} stopOpacity="0.55" />
            <stop offset="100%" stopColor={theme.accent} />
          </linearGradient>
          <filter id="pathSoft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.04" />
          </filter>
        </defs>

        <path
          d={pathD}
          fill="none"
          stroke={`${theme.accent}24`}
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#pathSoft)"
        />
        <path
          d={pathD}
          className="path-ribbon"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="0.72"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255, 250, 240, 0.45)"
          strokeWidth="0.28"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={pathD}
          fill="none"
          stroke="rgba(28, 43, 36, 0.28)"
          strokeWidth="0.06"
          strokeLinecap="round"
          strokeDasharray="0.18 0.16"
        />

        <g className="path-marker start-marker" transform={`translate(${startCenter.x} ${startCenter.y})`}>
          <circle r="0.42" fill="#1c2b24" opacity="0.12" />
          <circle r="0.28" fill={theme.accent} />
          <circle r="0.12" fill="#f7f1e4" />
        </g>

        <g className="path-marker end-marker" transform={`translate(${endCenter.x} ${endCenter.y})`}>
          <rect
            x="-0.34"
            y="-0.4"
            width="0.68"
            height="0.8"
            rx="0.06"
            fill="#f7f1e4"
            stroke={theme.accent}
            strokeWidth="0.07"
          />
          <rect x="-0.22" y="-0.26" width="0.44" height="0.08" rx="0.02" fill={theme.accent} />
          <rect x="-0.22" y="-0.08" width="0.34" height="0.05" rx="0.01" fill="#1c2b24" opacity="0.25" />
          <rect x="-0.22" y="0.05" width="0.3" height="0.05" rx="0.01" fill="#1c2b24" opacity="0.18" />
          <rect x="-0.32" y="0.48" width="0.64" height="0.1" rx="0.03" fill="#1c2b24" opacity="0.35" />
          <rect
            x="-0.3"
            y="0.5"
            width={0.6 * Math.max(0, baseHpRatio)}
            height="0.06"
            rx="0.02"
            fill={baseHpRatio > 0.35 ? theme.accent : '#c45c3e'}
          />
        </g>
      </svg>

      <BattleGrid
        level={level}
        occupiedKey={occupiedKey}
        placingKind={placingKind}
        phase={snapshot.phase}
        lives={snapshot.lives}
        hoverCol={hoverCell?.col ?? null}
        hoverRow={hoverCell?.row ?? null}
        onPlace={onPlace}
      />

      <div className="battle-entities">
        {snapshot.modules.map((mod) => {
          const def = MODULES[mod.kind]
          const firing = snapshot.firingModuleIds.has(mod.id)
          return (
            <div
              key={mod.id}
              className={`entity module-entity kind-${mod.kind} attack-${def.attack} chapter-${level.chapter}${firing ? ' firing' : ''}`}
              style={{
                left: `${(mod.col + 0.5) * cellW}%`,
                top: `${(mod.row + 0.5) * cellH}%`,
                ['--mod' as string]: def.color,
              }}
              title={def.name}
            >
              <img src={moduleSprite(level.chapter, mod.kind)} alt={def.name} draggable={false} />
              {snapshot.selectedModule === mod.kind && (
                <span
                  className="range-ring"
                  style={{
                    width: `${def.range * 2 * cellW}%`,
                    height: `${def.range * 2 * cellH * (level.cols / level.rows)}%`,
                  }}
                />
              )}
              {firing && <span className={`muzzle-flash muzzle-${def.attack}`} />}
            </div>
          )
        })}

        {snapshot.monsters.map((m) => {
          const pos = positionOnPath(level.path, m.progress)
          const themed = theme.monsters[m.kind]
          const slowed = snapshot.now < m.slowUntil
          const deg = ((pos.angle ?? 0) * 180) / Math.PI
          return (
            <div
              key={m.id}
              className={`entity monster-entity chapter-${level.chapter}${slowed ? ' slowed' : ''}`}
              style={{
                left: `${pos.x * cellW}%`,
                top: `${pos.y * cellH}%`,
                ['--face' as string]: `${deg}deg`,
                ['--mob' as string]: themed.color,
                ['--slow' as string]: '#6b8a2f',
              }}
              title={themed.name}
            >
              <div className="hp-bar">
                <i style={{ width: `${Math.max(0, (m.hp / m.maxHp) * 100)}%` }} />
              </div>
              <img src={monsterSprite(level.chapter, m.kind)} alt={themed.name} draggable={false} />
            </div>
          )
        })}

        {snapshot.projectiles.map((proj) => {
          const pos = projectilePos(proj)

          if (proj.kind === 'pulse' || proj.kind === 'blast') {
            const r = (proj.radius ?? 0.2) * 2
            return (
              <div
                key={proj.id}
                className={`entity pulse-ring pulse-${proj.kind} chapter-${level.chapter}`}
                style={{
                  left: `${pos.x * cellW}%`,
                  top: `${pos.y * cellH}%`,
                  width: `${r * cellW}%`,
                  height: `${r * cellH * (level.cols / level.rows)}%`,
                  borderColor: proj.color,
                  ['--proj' as string]: proj.color,
                }}
              />
            )
          }

          if (proj.kind === 'beam' || proj.kind === 'arc') {
            const dx = proj.toX - proj.fromX
            const dy = proj.toY - proj.fromY
            const len = Math.hypot(dx, dy)
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI
            const midX = (proj.fromX + proj.toX) / 2
            const midY = (proj.fromY + proj.toY) / 2
            return (
              <div
                key={proj.id}
                className={`entity bolt-line bolt-${proj.kind} chapter-${level.chapter}`}
                style={{
                  left: `${midX * cellW}%`,
                  top: `${midY * cellH}%`,
                  width: `${Math.max(len, 0.15) * cellW}%`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  ['--proj' as string]: proj.color,
                }}
              />
            )
          }

          const sprite = projectileSprite(proj.kind, level.chapter)
          return (
            <div
              key={proj.id}
              className={`entity projectile projectile-${proj.kind} kind-${proj.moduleKind} chapter-${level.chapter}`}
              style={{
                left: `${pos.x * cellW}%`,
                top: `${pos.y * cellH}%`,
                transform: `translate(-50%, -50%) rotate(${projectileAngle(proj)}deg)`,
                ['--proj' as string]: proj.color,
              }}
            >
              {sprite ? <img src={sprite} alt="" draggable={false} /> : <span className="proj-fallback" />}
            </div>
          )
        })}

        {snapshot.impacts.map((fx) => (
          <div
            key={fx.id}
            className={`entity impact impact-${fx.kind} chapter-${level.chapter}`}
            style={{
              left: `${fx.x * cellW}%`,
              top: `${fx.y * cellH}%`,
              ['--fx' as string]: fx.color,
            }}
          >
            <i className="impact-spark s1" />
            <i className="impact-spark s2" />
            <i className="impact-spark s3" />
            <i className="impact-spark s4" />
          </div>
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
