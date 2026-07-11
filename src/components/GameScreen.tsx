import { BattleMap } from './BattleMap'
import { HUD } from './HUD'
import { MatchPanel } from './MatchPanel'
import { ModuleBar } from './ModuleBar'
import { useGame } from '../game/useGame'

type Props = {
  levelId: string
  onBack: () => void
}

export function GameScreen({ levelId, onBack }: Props) {
  const { level, snapshot, selectModule, placeModule, selectWord, selectMeaning, reset } =
    useGame(levelId)

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
                ? `连击峰值相关表现不错。剩余生命 ${snapshot.lives}，金币 ${snapshot.gold}。`
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
