import { useEffect, useRef, useState } from 'react'
import { fetchLevelDetail, fetchLevelSummaries } from '../api/levels'
import { resolveChapter } from '../game/chapters'
import type { LevelDef, ModuleKind } from '../game/types'
import { useGame } from '../game/useGame'
import { getNextLevelId, markLevelCleared } from '../progress/store'
import { BattleMap } from './BattleMap'
import { HUD } from './HUD'
import { MatchPanel } from './MatchPanel'
import { ModuleBar } from './ModuleBar'

type Props = {
  levelId: string
  onBack: () => void
  onGoLevel: (levelId: string) => void
}

export function GameScreen({ levelId, onBack, onGoLevel }: Props) {
  const [level, setLevel] = useState<LevelDef | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLevel(null)
    setError(null)
    fetchLevelDetail(levelId)
      .then((data) => {
        if (alive) setLevel(data)
      })
      .catch((err: Error) => {
        if (alive) setError(err.message || '加载关卡失败')
      })
    return () => {
      alive = false
    }
  }, [levelId])

  if (error) {
    return (
      <div className="game-screen">
        <p className="level-status error">{error}</p>
        <button type="button" className="text-btn" onClick={onBack}>
          返回关卡
        </button>
      </div>
    )
  }

  if (!level) {
    return (
      <div className="game-screen">
        <p className="level-status">正在加载关卡词库…</p>
      </div>
    )
  }

  return <LoadedGame key={level.id} level={level} onBack={onBack} onGoLevel={onGoLevel} />
}

function LoadedGame({
  level,
  onBack,
  onGoLevel,
}: {
  level: LevelDef
  onBack: () => void
  onGoLevel: (levelId: string) => void
}) {
  const { snapshot, selectModule, placeModule, selectWord, selectMeaning, reset } = useGame(level)
  const [draggingKind, setDraggingKind] = useState<ModuleKind | null>(null)
  const [nextLevelId, setNextLevelId] = useState<string | null>(null)
  const savedWin = useRef(false)

  useEffect(() => {
    savedWin.current = false
    setNextLevelId(null)
  }, [level.id])

  useEffect(() => {
    if (snapshot.phase !== 'won' || savedWin.current) return
    savedWin.current = true
    void (async () => {
      const progress = await markLevelCleared(level.id)
      try {
        const summaries = await fetchLevelSummaries()
        const metas = summaries.map((s, i) => ({
          id: s.id,
          chapter: resolveChapter(s.chapter, i),
        }))
        setNextLevelId(getNextLevelId(metas, level.id, progress.clearedIds))
      } catch {
        setNextLevelId(null)
      }
    })()
  }, [snapshot.phase, level.id])

  const dropModuleAt = (kind: ModuleKind, clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY)
    const cell = el?.closest('[data-cell-col][data-cell-row]') as HTMLElement | null
    if (!cell) return
    const col = Number(cell.dataset.cellCol)
    const row = Number(cell.dataset.cellRow)
    if (Number.isFinite(col) && Number.isFinite(row)) {
      placeModule(col, row, kind)
    }
  }

  return (
    <div className="game-screen game-screen--play">
      <HUD level={level} snapshot={snapshot} onBack={onBack} onReset={reset} />

      <div className="game-play-body">
        <BattleMap
          level={level}
          snapshot={snapshot}
          onPlace={placeModule}
          draggingKind={draggingKind}
        />

        <div className="game-play-controls">
          <ModuleBar
            level={level}
            snapshot={snapshot}
            onSelect={selectModule}
            onDragChange={setDraggingKind}
            onDropAt={dropModuleAt}
          />

          <MatchPanel
            snapshot={snapshot}
            onSelectWord={selectWord}
            onSelectMeaning={selectMeaning}
          />
        </div>
      </div>

      {(snapshot.phase === 'won' || snapshot.phase === 'lost') && (
        <div className="overlay">
          <div className="overlay-card">
            <h2>{snapshot.phase === 'won' ? '课本保住了' : '课本被啃穿了'}</h2>
            <p>
              {snapshot.phase === 'won'
                ? `连击峰值相关表现不错。课本剩余 ${snapshot.lives}，金币 ${snapshot.gold}。`
                : '再匹配几组词，多放几门炮试试。'}
            </p>
            <div className="overlay-actions">
              {snapshot.phase === 'won' && nextLevelId && (
                <button type="button" className="primary-btn" onClick={() => onGoLevel(nextLevelId)}>
                  下一关
                </button>
              )}
              <button
                type="button"
                className={snapshot.phase === 'won' && nextLevelId ? 'ghost-btn' : 'primary-btn'}
                onClick={reset}
              >
                再来一局
              </button>
              <button type="button" className="ghost-btn" onClick={onBack}>
                返回关卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
