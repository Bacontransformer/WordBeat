import type { GameSnapshot, LevelDef } from '../game/types'
import { CHAPTERS } from '../game/chapters'

type Props = {
  level: LevelDef
  snapshot: GameSnapshot
  onBack: () => void
  onReset: () => void
}

export function HUD({ level, snapshot, onBack, onReset }: Props) {
  const phaseLabel =
    snapshot.phase === 'ready'
      ? `准备 ${Math.ceil(snapshot.preparingLeft)}s`
      : snapshot.phase === 'playing'
        ? `波次 ${snapshot.waveIndex + 1}/${snapshot.waveTotal}`
        : snapshot.phase === 'won'
          ? '通关'
          : '失败'

  const chapterName = CHAPTERS[level.chapter].name

  return (
    <header className="hud">
      <div className="hud-left">
        <button type="button" className="text-btn" onClick={onBack}>
          关卡
        </button>
        <div className="hud-title">
          <strong>{level.name}</strong>
          <span>
            {chapterName} · {phaseLabel}
          </span>
        </div>
      </div>
      <div className="hud-stats">
        <span className="stat gold">{snapshot.gold} 金</span>
        <span className="stat lives">
          课本 {snapshot.lives}/{snapshot.maxLives}
        </span>
        <span className="stat combo">连击 {snapshot.combo}</span>
      </div>
      <button type="button" className="text-btn" onClick={onReset}>
        重开
      </button>
    </header>
  )
}
