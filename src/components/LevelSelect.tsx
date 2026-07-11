import { LEVELS } from '../game/levels'

type Props = {
  onSelect: (levelId: string) => void
}

export function LevelSelect({ onSelect }: Props) {
  return (
    <div className="level-select">
      <div className="level-hero">
        <p className="brand">WordBeat</p>
        <h1>用单词守住课本</h1>
        <p className="lede">点选配对赚金币，部署攻击模组，拦住错题本里爬出来的怪物。</p>
      </div>

      <div className="level-list">
        {LEVELS.map((level, index) => (
          <button
            key={level.id}
            type="button"
            className="level-card"
            onClick={() => onSelect(level.id)}
          >
            <span className="level-index">第 {index + 1} 关</span>
            <strong>{level.name}</strong>
            <span>{level.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
