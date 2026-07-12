import { useEffect, useMemo, useState } from 'react'
import { fetchLevelSummaries, type LevelSummary } from '../api/levels'
import { CHAPTERS, resolveChapter, type ChapterId } from '../game/chapters'
import { fetchProgress, getLevelAccess } from '../progress/store'

type Props = {
  onSelect: (levelId: string) => void
}

/**
 * 三章等分（约 333px 宽），每章 5 关蛇形前进，全部落在色带内，不绕回、不压列表。
 * viewBox: 1000 × 200
 */
const NODE_POS: { x: number; y: number }[] = [
  // 丛林 1–5
  { x: 70, y: 58 },
  { x: 130, y: 132 },
  { x: 195, y: 58 },
  { x: 255, y: 132 },
  { x: 310, y: 72 },
  // 海洋 6–10
  { x: 375, y: 128 },
  { x: 435, y: 58 },
  { x: 500, y: 132 },
  { x: 565, y: 58 },
  { x: 630, y: 120 },
  // 天空 11–15
  { x: 695, y: 58 },
  { x: 755, y: 132 },
  { x: 820, y: 58 },
  { x: 885, y: 132 },
  { x: 950, y: 70 },
]

/** 平滑连接上述节点的弯曲线 */
const PATH_D = [
  'M 70 58',
  'C 95 40, 110 150, 130 132',
  'S 170 40, 195 58',
  'S 230 150, 255 132',
  'S 290 50, 310 72',
  'S 340 150, 375 128',
  'S 405 40, 435 58',
  'S 470 150, 500 132',
  'S 535 40, 565 58',
  'S 600 145, 630 120',
  'S 660 40, 695 58',
  'S 725 150, 755 132',
  'S 790 40, 820 58',
  'S 855 150, 885 132',
  'S 920 50, 950 70',
].join(' ')

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
              <small>1–5</small>
            </div>
            <div className="band band-ocean">
              <span>{CHAPTERS.ocean.name}</span>
              <small>6–10</small>
            </div>
            <div className="band band-sky">
              <span>{CHAPTERS.sky.name}</span>
              <small>11–15</small>
            </div>
          </div>

          <svg className="world-map-svg" viewBox="0 0 1000 200" role="img">
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
                  role={unlocked ? 'button' : undefined}
                  tabIndex={unlocked ? 0 : undefined}
                  style={{ cursor: unlocked ? 'pointer' : 'default' }}
                  onClick={() => unlocked && onSelect(level.id)}
                  onKeyDown={(e) => {
                    if (!unlocked) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(level.id)
                    }
                  }}
                >
                  {frontier && (
                    <g className="map-flag" transform="translate(14 -28)">
                      <line x1="0" y1="0" x2="0" y2="28" stroke="#1c2b24" strokeWidth="2.2" />
                      <path d="M0 2 L18 8 L0 14 Z" fill="#c45c3e" />
                    </g>
                  )}
                  <circle className="map-node-hit" r="22" fill="transparent" />
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
