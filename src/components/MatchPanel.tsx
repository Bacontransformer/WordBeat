import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { getVoiceAccent, setVoiceAccent, speakWord, type VoiceAccent } from '../game/speak'
import type { GameSnapshot } from '../game/types'

type Props = {
  snapshot: GameSnapshot
  onSelectWord: (id: string) => void
  onSelectMeaning: (id: string) => void
}

type DragSide = 'word' | 'meaning'

type DragState = {
  side: DragSide
  id: string
  label: string
  x: number
  y: number
  startX: number
  startY: number
  moved: boolean
}

export function MatchPanel({ snapshot, onSelectWord, onSelectMeaning }: Props) {
  const { matchRound, selectedWordId, matchedIds, matchFeedback, combo } = snapshot
  const [drag, setDrag] = useState<DragState | null>(null)
  const [accent, setAccent] = useState<VoiceAccent>(() => getVoiceAccent())
  const dragRef = useRef<DragState | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const lineRef = useRef<SVGLineElement | null>(null)

  const suppressClickRef = useRef(false)
  const busy = matchFeedback === 'bad'

  const changeAccent = (next: VoiceAccent) => {
    setVoiceAccent(next)
    setAccent(next)
  }

  const paintGhost = (x: number, y: number, startX: number, startY: number) => {
    const ghost = ghostRef.current
    if (ghost) {
      ghost.style.left = `${x}px`
      ghost.style.top = `${y}px`
    }
    const line = lineRef.current
    if (line) {
      line.setAttribute('x2', String(x))
      line.setAttribute('y2', String(y))
      line.setAttribute('x1', String(startX))
      line.setAttribute('y1', String(startY))
    }
  }

  const beginDrag = (
    e: ReactPointerEvent<HTMLButtonElement>,
    side: DragSide,
    id: string,
    label: string,
  ) => {
    if (busy || matchedIds.has(id)) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    if (side === 'word') onSelectWord(id)
    const next: DragState = {
      side,
      id,
      label,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    }
    dragRef.current = next
    setDrag(next)
  }

  const moveDrag = (e: ReactPointerEvent, id: string) => {
    const cur = dragRef.current
    if (!cur || cur.id !== id) return
    const dx = e.clientX - cur.startX
    const dy = e.clientY - cur.startY
    const moved = cur.moved || dx * dx + dy * dy > 64
    cur.x = e.clientX
    cur.y = e.clientY
    if (moved && !cur.moved) {
      cur.moved = true
      setDrag({ ...cur })
    } else if (cur.moved) {
      paintGhost(cur.x, cur.y, cur.startX, cur.startY)
    }
  }

  const finishDrag = (clientX: number, clientY: number, moved: boolean) => {
    const cur = dragRef.current
    if (cur && moved) {
      const el = document.elementFromPoint(clientX, clientY)
      if (cur.side === 'word') {
        const meaningEl = el?.closest('[data-meaning-id]') as HTMLElement | null
        const meaningId = meaningEl?.dataset.meaningId
        if (meaningId && !matchedIds.has(meaningId)) onSelectMeaning(meaningId)
      } else {
        const wordEl = el?.closest('[data-word-id]') as HTMLElement | null
        const wordId = wordEl?.dataset.wordId
        if (wordId && !matchedIds.has(wordId)) {
          onSelectWord(wordId)
          onSelectMeaning(cur.id)
        }
      }
    }
    dragRef.current = null
    setDrag(null)
  }

  const cancelDrag = () => {
    dragRef.current = null
    setDrag(null)
  }

  return (
    <section className={`match-panel feedback-${matchFeedback ?? 'none'}${drag?.moved ? ' dragging' : ''}`}>
      <header className="match-header">
        <div className="match-header-main">
          <h2>单词匹配</h2>
          <p>左右互拖或点选 · 四对 · 连击 {combo}</p>
        </div>
        <div className="voice-accent" role="group" aria-label="发音口音">
          <button
            type="button"
            className={`voice-accent-btn${accent === 'en-US' ? ' active' : ''}`}
            onClick={() => {
              changeAccent('en-US')
              void speakWord('hello', 'en-US')
            }}
          >
            美音
          </button>
          <button
            type="button"
            className={`voice-accent-btn${accent === 'en-GB' ? ' active' : ''}`}
            onClick={() => {
              changeAccent('en-GB')
              void speakWord('hello', 'en-GB')
            }}
          >
            英音
          </button>
        </div>
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
                className={`match-chip word${done ? ' done' : ''}${selected ? ' selected' : ''}${drag?.side === 'word' && drag.id === w.id && drag.moved ? ' dragging-chip' : ''}${drag?.side === 'meaning' && drag.moved ? ' drop-target' : ''}`}
                disabled={done || busy}
                data-word-id={w.id}
                onPointerDown={(e) => beginDrag(e, 'word', w.id, w.word)}
                onPointerMove={(e) => moveDrag(e, w.id)}
                onPointerUp={(e) => {
                  const cur = dragRef.current
                  if (!cur || cur.id !== w.id) return
                  finishDrag(e.clientX, e.clientY, cur.moved)
                }}
                onPointerCancel={cancelDrag}
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
                className={`match-chip meaning${done ? ' done' : ''}${drag?.side === 'meaning' && drag.id === m.id && drag.moved ? ' dragging-chip' : ''}${drag?.side === 'word' && drag.moved ? ' drop-target' : ''}`}
                disabled={done || busy}
                data-meaning-id={m.id}
                onPointerDown={(e) => beginDrag(e, 'meaning', m.id, m.meaning)}
                onPointerMove={(e) => moveDrag(e, m.id)}
                onPointerUp={(e) => {
                  const cur = dragRef.current
                  if (!cur || cur.id !== m.id) return
                  if (!cur.moved && canTap) {
                    suppressClickRef.current = true
                    onSelectMeaning(m.id)
                    cancelDrag()
                    return
                  }
                  finishDrag(e.clientX, e.clientY, cur.moved)
                }}
                onPointerCancel={cancelDrag}
                onClick={() => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false
                    return
                  }
                  if (canTap && !dragRef.current?.moved) onSelectMeaning(m.id)
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
              ref={lineRef}
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
          <div
            ref={ghostRef}
            className="match-drag-ghost"
            style={{ left: drag.x, top: drag.y }}
            aria-hidden
          >
            {drag.label}
          </div>
        </>
      )}
    </section>
  )
}
