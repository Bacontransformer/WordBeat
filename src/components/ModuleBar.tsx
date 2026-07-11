import { MODULES } from '../game/defs'
import { MODULE_SPRITE } from '../game/sprites'
import type { GameSnapshot, LevelDef, ModuleKind } from '../game/types'

type Props = {
  level: LevelDef
  snapshot: GameSnapshot
  onSelect: (kind: ModuleKind | null) => void
}

export function ModuleBar({ level, snapshot, onSelect }: Props) {
  return (
    <div className="module-bar">
      {level.unlockedModules.map((kind) => {
        const def = MODULES[kind]
        const selected = snapshot.selectedModule === kind
        const affordable = snapshot.gold >= def.cost
        return (
          <button
            key={kind}
            type="button"
            className={`module-card${selected ? ' selected' : ''}${affordable ? '' : ' locked'}`}
            style={{ ['--mod' as string]: def.color }}
            onClick={() => onSelect(selected ? null : kind)}
            disabled={snapshot.phase === 'won' || snapshot.phase === 'lost'}
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
    </div>
  )
}
