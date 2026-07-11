import { useEffect, useState } from 'react'
import { fetchLevelSummaries, type LevelSummary } from '../api/levels'

type Props = {
  onSelect: (levelId: string) => void
}

export function LevelSelect({ onSelect }: Props) {
  const [levels, setLevels] = useState<LevelSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
    <div className="level-select">
      <div className="level-hero">
        <p className="brand">WordBeat</p>
        <h1>用单词守住课本</h1>
        <p className="lede">点选配对赚金币，部署攻击模组，拦住错题本里爬出来的怪物。</p>
      </div>

      {loading && <p className="level-status">正在从数据库加载关卡…</p>}
      {error && (
        <p className="level-status error">
          {error}
          <br />
          请确认已运行 <code>npm run server</code> 且 MySQL 已初始化。
        </p>
      )}

      <div className="level-list">
        {levels.map((level, index) => (
          <button
            key={level.id}
            type="button"
            className="level-card"
            onClick={() => onSelect(level.id)}
          >
            <span className="level-index">第 {index + 1} 关 · {level.pack_name}</span>
            <strong>{level.name}</strong>
            <span>{level.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
