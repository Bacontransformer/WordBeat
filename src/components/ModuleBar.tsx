import { useRef, useState } from 'react'
import { MODULES } from '../game/defs'
import { MODULE_SPRITE } from '../game/sprites'
import type { GameSnapshot, LevelDef, ModuleKind } from '../game/types'

type Props = {
  level: LevelDef
  snapshot: GameSnapshot
  onSelect: (kind: ModuleKind | null) => void
  onDragChange?: (kind: ModuleKind | null) => void
  onDropAt?: (kind: ModuleKind, clientX: number, clientY: number) => void
}

type DragState = {
  kind: ModuleKind
  x: number
  y: number
  startX: number
  startY: number
  moved: boolean
}

export function ModuleBar({ level, snapshot, onSelect, onDragChange, onDropAt }: Props) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)
  const ended = snapshot.phase === 'won' || snapshot.phase === 'lost'

  return (
    <div className={`module-bar${drag?.moved ? ' module-bar-dragging' : ''}`}>
      {level.unlockedModules.map((kind) => {
        const def = MODULES[kind]
        const selected = snapshot.selectedModule === kind
        const affordable = snapshot.gold >= def.cost
        return (
          <button
            key={kind}
            type="button"
            className={`module-card${selected ? ' selected' : ''}${affordable ? '' : ' locked'}${drag?.kind === kind && drag.moved ? ' dragging' : ''}`}
            style={{ ['--mod' as string]: def.color }}
            disabled={ended || !affordable}
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false
                return
              }
              onSelect(selected ? null : kind)
            }}
            onPointerDown={(e) => {
              if (ended || !affordable) return
              e.preventDefault()
              e.currentTarget.setPointerCapture(e.pointerId)
              onSelect(kind)
              const next: DragState = {
                kind,
                x: e.clientX,
                y: e.clientY,
                startX: e.clientX,
                startY: e.clientY,
                moved: false,
              }
              dragRef.current = next
              setDrag(next)
              onDragChange?.(kind)
            }}
            onPointerMove={(e) => {
              const cur = dragRef.current
              if (!cur || cur.kind !== kind) return
              const dx = e.clientX - cur.startX
              const dy = e.clientY - cur.startY
              const moved = cur.moved || dx * dx + dy * dy > 64
              const next = { ...cur, x: e.clientX, y: e.clientY, moved }
              dragRef.current = next
              setDrag(next)
              if (moved) onDragChange?.(kind)
            }}
            onPointerUp={(e) => {
              const cur = dragRef.current
              if (!cur || cur.kind !== kind) return
              if (cur.moved) {
                suppressClickRef.current = true
                onDropAt?.(kind, e.clientX, e.clientY)
              }
              dragRef.current = null
              setDrag(null)
              onDragChange?.(null)
            }}
            onPointerCancel={() => {
              dragRef.current = null
              setDrag(null)
              onDragChange?.(null)
            }}
          >
            <img className="module-card-art" src={MODULE_SPRITE[kind]} alt="" draggable={false} />
            <span className="module-card-copy">
              <span className="module-card-name">{def.name}</span>
              <span className="module-card-desc">{def.desc}</span>
              <span className="module-card-cost">{def.cost} 金</span>
            </span>
          </button>
        )
      })}

      {drag?.moved && (
        <div
          className="module-drag-ghost"
          style={{
            left: drag.x,
            top: drag.y,
            ['--mod' as string]: MODULES[drag.kind].color,
          }}
          aria-hidden
        >
          <img src={MODULE_SPRITE[drag.kind]} alt="" draggable={false} />
          <span>{MODULES[drag.kind].name}</span>
        </div>
      )}
    </div>
  )
}
