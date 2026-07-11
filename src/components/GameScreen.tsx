import { useEffect, useState } from 'react'
import { fetchLevelDetail } from '../api/levels'
import type { LevelDef } from '../game/types'
import { useGame } from '../game/useGame'
import { BattleMap } from './BattleMap'
import { HUD } from './HUD'
import { MatchPanel } from './MatchPanel'
import { ModuleBar } from './ModuleBar'

type Props = {
  levelId: string
  onBack: () => void
}

export function GameScreen({ levelId, onBack }: Props) {
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

  return <LoadedGame level={level} onBack={onBack} />
}

function LoadedGame({ level, onBack }: { level: LevelDef; onBack: () => void }) {
  const { snapshot, selectModule, placeModule, selectWord, selectMeaning, reset } = useGame(level)

  return (
    <div className="game-screen">
      <HUD level={level} snapshot={snapshot} onBack={onBack} onReset={reset} />

      <BattleMap level={level} snapshot={snapshot} onPlace={placeModule} />

      <ModuleBar level={level} snapshot={snapshot} onSelect={selectModule} />

      <MatchPanel
        snapshot={snapshot}
        onSelectWord={selectWord}
        onSelectMeaning={selectMeaning}
      />

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
              <button type="button" className="primary-btn" onClick={reset}>
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
