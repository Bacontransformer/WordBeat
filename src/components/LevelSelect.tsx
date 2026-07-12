import { useEffect, useMemo, useState } from 'react'
import { fetchLevelSummaries, type LevelSummary } from '../api/levels'
import { CHAPTERS, resolveChapter, type ChapterId } from '../game/chapters'
import { fetchProgress, getLevelAccess } from '../progress/store'

type Props = {
  onSelect: (levelId: string) => void
}

/** Winding path node positions in viewBox 0..1000 x 0..640 */
const NODE_POS: { x: number; y: number }[] = [
  { x: 90, y: 120 },
  { x: 260, y: 200 },
  { x: 420, y: 130 },
  { x: 580, y: 230 },
  { x: 740, y: 150 },
  { x: 900, y: 240 },
]

const PATH_D =
  'M 90 120 C 160 80, 210 220, 260 200 S 360 90, 420 130 S 500 250, 580 230 S 660 100, 740 150 S 820 280, 900 240'

export function LevelSelect({ onSelect }: Props) {
  const [levels, setLevels] = useState<LevelSummary[]>([])
  const [clearedIds, setClearedIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add('home-mode')
    return () => document.body.classList.remove('home-mode')
  }, [])

  useEffect(() => {
    let alive = true
    Promise.all([fetchLevelSummaries(), fetchProgress()])
      .then(([levelData, progress]) => {
        if (!alive) return
        setLevels(levelData)
        setClearedIds(progress.clearedIds)
      })
      .catch((err: Error) => {
        if (alive) setError(err.message || '无法加载关卡')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const access = useMemo(
    () => getLevelAccess(
      levels.map((l) => l.id),
      clearedIds,
    ),
    [levels, clearedIds],
  )

  return (
    <div className="home home-map-page">
      <header className="home-top">
        <div>
          <p className="brand">WordBeat</p>
          <p className="home-top-line">丛林 · 海洋 · 天空 — 沿墨迹前进</p>
        </div>
        <p className="home-top-hint">通关解锁下一关 · 旗子标记当前进度</p>
      </header>

      {loading && <p className="level-status">正在加载关卡地图…</p>}
      {error && (
        <p className="level-status error">
          {error}
          <br />
          网页端请确认 API 与 MySQL 已启动；安卓离线版请重新打开应用。
        </p>
      )}

      {!loading && !error && (
        <section className="world-map" aria-label="关卡地图">
          <div className="world-map-bands" aria-hidden>
            <div className="band band-jungle">
              <span>{CHAPTERS.jungle.name}</span>
            </div>
            <div className="band band-ocean">
              <span>{CHAPTERS.ocean.name}</span>
            </div>
            <div className="band band-sky">
              <span>{CHAPTERS.sky.name}</span>
            </div>
          </div>

          <svg className="world-map-svg" viewBox="0 0 1000 360" role="img">
            <title>弯曲线关卡路线</title>
            <path className="world-path-glow" d={PATH_D} fill="none" />
            <path className="world-path" d={PATH_D} fill="none" />

            {levels.map((level, index) => {
              const pos = NODE_POS[index] ?? NODE_POS[NODE_POS.length - 1]
              const chapter = resolveChapter(level.chapter, index)
              const unlocked = access.unlocked.has(level.id)
              const cleared = access.cleared.has(level.id)
              const frontier = access.frontierId === level.id
              return (
                <g
                  key={level.id}
                  className={`map-node chapter-${chapter}${unlocked ? ' open' : ' locked'}${cleared ? ' cleared' : ''}${frontier ? ' frontier' : ''}`}
                  transform={`translate(${pos.x} ${pos.y})`}
                >
                  {frontier && (
                    <g className="map-flag" transform="translate(18 -34)">
                      <line x1="0" y1="0" x2="0" y2="34" stroke="#1c2b24" strokeWidth="2.5" />
                      <path d="M0 2 L22 10 L0 18 Z" fill="#c45c3e" />
                    </g>
                  )}
                  <circle className="map-node-ring" r="22" />
                  <circle className="map-node-core" r="16" />
                  <text className="map-node-num" textAnchor="middle" dominantBaseline="central">
                    {cleared ? '✓' : index + 1}
                  </text>
                </g>
              )
            })}
          </svg>

          <ol className="map-level-list">
            {levels.map((level, index) => {
              const chapter = resolveChapter(level.chapter, index) as ChapterId
              const theme = CHAPTERS[chapter]
              const unlocked = access.unlocked.has(level.id)
              const cleared = access.cleared.has(level.id)
              const frontier = access.frontierId === level.id
              return (
                <li key={level.id}>
                  <button
                    type="button"
                    className={`map-level-btn chapter-${chapter}${unlocked ? '' : ' is-locked'}${frontier ? ' is-frontier' : ''}${cleared ? ' is-cleared' : ''}`}
                    disabled={!unlocked}
                    onClick={() => unlocked && onSelect(level.id)}
                  >
                    <span className="map-level-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="map-level-copy">
                      <span className="map-level-meta">
                        {theme.name}
                        {frontier ? ' · 当前' : cleared ? ' · 已通关' : unlocked ? '' : ' · 未解锁'}
                      </span>
                      <strong>{level.name}</strong>
                      <span className="map-level-sub">{level.subtitle}</span>
                    </span>
                    <span className="map-level-go">{unlocked ? (frontier ? '旗下开战' : '进入') : '锁住'}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </div>
  )
}
