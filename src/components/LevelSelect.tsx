import { useEffect, useState } from 'react'
import { fetchLevelSummaries, type LevelSummary } from '../api/levels'

type Props = {
  onSelect: (levelId: string) => void
}

const FLOAT_WORDS = [
  'apple',
  'journey',
  'echo',
  'defend',
  'notebook',
  'rhythm',
  'ink',
  'memory',
  'beacon',
  'voyage',
]

const TONE: Record<string, string> = {
  junior: '入门',
  cet4: '进阶',
  senior: '高压',
}

export function LevelSelect({ onSelect }: Props) {
  const [levels, setLevels] = useState<LevelSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add('home-mode')
    return () => document.body.classList.remove('home-mode')
  }, [])

  useEffect(() => {
    let alive = true
    fetchLevelSummaries()
      .then((data) => {
        if (alive) setLevels(data)
      })
      .catch((err: Error) => {
        if (alive) setError(err.message || '无法连接服务器')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="home">
      <section className="home-hero">
        <div className="hero-float" aria-hidden>
          {FLOAT_WORDS.map((w, i) => (
            <span key={w} className={`float-chip chip-${i % 5}`} style={{ ['--i' as string]: i }}>
              {w}
            </span>
          ))}
        </div>

        <svg className="hero-path" viewBox="0 0 1200 520" preserveAspectRatio="none" aria-hidden>
          <path
            className="hero-path-glow"
            d="M-20 210 C 180 40, 320 380, 520 220 S 820 60, 980 250 S 1180 420, 1240 180"
            fill="none"
          />
          <path
            className="hero-path-stroke"
            d="M-20 210 C 180 40, 320 380, 520 220 S 820 60, 980 250 S 1180 420, 1240 180"
            fill="none"
          />
        </svg>

        <div className="hero-copy">
          <p className="brand">WordBeat</p>
          <p className="hero-line">用单词，守住课本。</p>
          <p className="lede">
            点选配对赚金币，沿弯曲墨迹部署攻击模组——别让错题本里的怪物啃穿终点。
          </p>
          <a className="hero-cue" href="#chapters">
            翻开错题本
            <span aria-hidden>↓</span>
          </a>
        </div>
      </section>

      <section id="chapters" className="home-chapters">
        <header className="chapters-head">
          <h2>战场章节</h2>
          <p>六条路线，三种词库。越往后，墨迹越绕，怪物越密。</p>
        </header>

        {loading && <p className="level-status">正在从数据库加载关卡…</p>}
        {error && (
          <p className="level-status error">
            {error}
            <br />
            请确认已运行 <code>npm run server</code> 且 MySQL 已初始化。
          </p>
        )}

        <ol className="chapter-list">
          {levels.map((level, index) => (
            <li key={level.id} className={`chapter-row tone-${level.pack_slug}`}>
              <button type="button" className="chapter-hit" onClick={() => onSelect(level.id)}>
                <span className="chapter-num">{String(index + 1).padStart(2, '0')}</span>
                <span className="chapter-main">
                  <span className="chapter-meta">
                    {TONE[level.pack_slug] ?? '关卡'} · {level.pack_name}
                  </span>
                  <strong>{level.name}</strong>
                  <span className="chapter-sub">{level.subtitle}</span>
                </span>
                <span className="chapter-path" aria-hidden>
                  <svg viewBox="0 0 120 36" preserveAspectRatio="none">
                    <path
                      d={
                        index % 3 === 0
                          ? 'M2 28 C 30 4, 50 32, 78 12 S 110 30, 118 8'
                          : index % 3 === 1
                            ? 'M2 8 C 28 30, 55 4, 80 26 S 105 6, 118 22'
                            : 'M2 18 C 25 4, 45 34, 70 10 S 95 28, 118 14'
                      }
                    />
                  </svg>
                </span>
                <span className="chapter-go">开战</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
