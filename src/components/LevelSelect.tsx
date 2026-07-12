import { useEffect, useMemo, useState } from 'react'
import { fetchLevelSummaries, type LevelSummary } from '../api/levels'
import { CHAPTERS, resolveChapter, type ChapterId } from '../game/chapters'
import { fetchProgress, getLevelAccess } from '../progress/store'

type Props = {
  onSelect: (levelId: string) => void
}

/** 15 nodes along a winding ink path (viewBox 1000x420). */
const NODE_POS: { x: number; y: number }[] = [
  { x: 70, y: 90 },
  { x: 160, y: 150 },
  { x: 250, y: 95 },
  { x: 330, y: 165 },
  { x: 410, y: 110 },
  { x: 490, y: 175 },
  { x: 560, y: 105 },
  { x: 640, y: 165 },
  { x: 710, y: 100 },
  { x: 780, y: 170 },
  { x: 850, y: 115 },
  { x: 910, y: 175 },
  { x: 860, y: 250 },
  { x: 760, y: 290 },
  { x: 640, y: 260 },
]

const PATH_D =
  'M 70 90 C 110 60, 140 170, 160 150 S 220 70, 250 95 S 300 180, 330 165 S 370 80, 410 110 S 450 190, 490 175 S 530 70, 560 105 S 600 185, 640 165 S 680 70, 710 100 S 750 190, 780 170 S 820 80, 850 115 S 890 185, 910 175 S 930 220, 860 250 S 800 310, 760 290 S 700 240, 640 260'

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

  const metas = useMemo(
    () =>
      levels.map((l, i) => ({
        id: l.id,
        chapter: resolveChapter(l.chapter, i),
      })),
    [levels],
  )

  const access = useMemo(() => getLevelAccess(metas, clearedIds), [metas, clearedIds])

  return (
    <div className="home home-map-page">
      <header className="home-top">
        <div>
          <p className="brand">WordBeat</p>
          <p className="home-top-line">丛林 · 海洋 · 天空 — 每章 5 关</p>
        </div>
        <p className="home-top-hint">通关本章全部关卡可解锁下一章 · 旗子标记当前进度</p>
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

          <svg className="world-map-svg world-map-svg-tall" viewBox="0 0 1000 340" role="img">
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
                    <g className="map-flag" transform="translate(14 -28)">
                      <line x1="0" y1="0" x2="0" y2="28" stroke="#1c2b24" strokeWidth="2.2" />
                      <path d="M0 2 L18 8 L0 14 Z" fill="#c45c3e" />
                    </g>
                  )}
                  <circle className="map-node-ring" r="16" />
                  <circle className="map-node-core" r="12" />
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
