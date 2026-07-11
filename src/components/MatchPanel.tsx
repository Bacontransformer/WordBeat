import { useRef, useState } from 'react'
import type { GameSnapshot } from '../game/types'

type Props = {
  snapshot: GameSnapshot
  onSelectWord: (id: string) => void
  onSelectMeaning: (id: string) => void
}

type DragState = {
  wordId: string
  x: number
  y: number
  startX: number
  startY: number
  moved: boolean
}

export function MatchPanel({ snapshot, onSelectWord, onSelectMeaning }: Props) {
  const { matchRound, selectedWordId, matchedIds, matchFeedback, combo } = snapshot
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const busy = matchFeedback === 'bad'

  const finishDrag = (clientX: number, clientY: number, moved: boolean) => {
    if (moved) {
      const el = document.elementFromPoint(clientX, clientY)
      const meaningEl = el?.closest('[data-meaning-id]') as HTMLElement | null
      const meaningId = meaningEl?.dataset.meaningId
      if (meaningId && !matchedIds.has(meaningId)) {
        onSelectMeaning(meaningId)
      }
    }
    dragRef.current = null
    setDrag(null)
  }

  return (
    <section className={`match-panel feedback-${matchFeedback ?? 'none'}${drag?.moved ? ' dragging' : ''}`}>
      <header className="match-header">
        <h2>单词匹配</h2>
        <p>点选或滑向释义 · 连击 {combo}</p>
      </header>

      <div className="match-columns">
        <div className="match-col">
          {matchRound.words.map((w) => {
            const done = matchedIds.has(w.id)
            const selected = selectedWordId === w.id
            return (
              <button
                key={w.id}
                type="button"
                className={`match-chip word${done ? ' done' : ''}${selected ? ' selected' : ''}${drag?.wordId === w.id && drag.moved ? ' dragging-chip' : ''}`}
                disabled={done || busy}
                data-word-id={w.id}
                onPointerDown={(e) => {
                  if (done || busy) return
                  e.preventDefault()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  onSelectWord(w.id)
                  const next: DragState = {
                    wordId: w.id,
                    x: e.clientX,
                    y: e.clientY,
                    startX: e.clientX,
                    startY: e.clientY,
                    moved: false,
                  }
                  dragRef.current = next
                  setDrag(next)
                }}
                onPointerMove={(e) => {
                  const cur = dragRef.current
                  if (!cur || cur.wordId !== w.id) return
                  const dx = e.clientX - cur.startX
                  const dy = e.clientY - cur.startY
                  const moved = cur.moved || dx * dx + dy * dy > 64
                  const next = { ...cur, x: e.clientX, y: e.clientY, moved }
                  dragRef.current = next
                  setDrag(next)
                }}
                onPointerUp={(e) => {
                  const cur = dragRef.current
                  if (!cur || cur.wordId !== w.id) return
                  finishDrag(e.clientX, e.clientY, cur.moved)
                }}
                onPointerCancel={() => {
                  dragRef.current = null
                  setDrag(null)
                }}
              >
                {w.word}
              </button>
            )
          })}
        </div>
        <div className="match-col">
          {matchRound.meanings.map((m) => {
            const done = matchedIds.has(m.id)
            const canTap = Boolean(selectedWordId) && !done && !busy && !drag?.moved
            return (
              <button
                key={m.id}
                type="button"
                className={`match-chip meaning${done ? ' done' : ''}${drag?.moved ? ' drop-target' : ''}`}
                disabled={done || busy || (!selectedWordId && !drag)}
                data-meaning-id={m.id}
                onClick={() => {
                  if (canTap) onSelectMeaning(m.id)
                }}
              >
                {m.meaning}
              </button>
            )
          })}
        </div>
      </div>

      {drag?.moved && (
        <>
          <svg className="match-drag-line" aria-hidden>
            <line
              x1={drag.startX}
              y1={drag.startY}
              x2={drag.x}
              y2={drag.y}
              stroke="#c45c3e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          </svg>
          <div className="match-drag-ghost" style={{ left: drag.x, top: drag.y }} aria-hidden>
            {matchRound.words.find((item) => item.id === drag.wordId)?.word}
          </div>
        </>
      )}
    </section>
  )
}
