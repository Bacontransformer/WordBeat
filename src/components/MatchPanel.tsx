import type { GameSnapshot } from '../game/types'

type Props = {
  snapshot: GameSnapshot
  onSelectWord: (id: string) => void
  onSelectMeaning: (id: string) => void
}

export function MatchPanel({ snapshot, onSelectWord, onSelectMeaning }: Props) {
  const { matchRound, selectedWordId, matchedIds, matchFeedback, combo } = snapshot

  return (
    <section className={`match-panel feedback-${matchFeedback ?? 'none'}`}>
      <header className="match-header">
        <h2>单词匹配</h2>
        <p>点选英文听发音，再点对应释义 · 连击 {combo}</p>
      </header>

      <div className="match-columns">
        <div className="match-col">
          {matchRound.words.map((w) => {
            const done = matchedIds.has(w.id)
            const selected = selectedWordId === w.id
            return (
              <button
                key={w.id}
                type="button"
                className={`match-chip word${done ? ' done' : ''}${selected ? ' selected' : ''}`}
                disabled={done || matchFeedback === 'bad'}
                onClick={() => onSelectWord(w.id)}
              >
                {w.word}
              </button>
            )
          })}
        </div>
        <div className="match-col">
          {matchRound.meanings.map((m) => {
            const done = matchedIds.has(m.id)
            return (
              <button
                key={m.id}
                type="button"
                className={`match-chip meaning${done ? ' done' : ''}`}
                disabled={done || !selectedWordId || matchFeedback === 'bad'}
                onClick={() => onSelectMeaning(m.id)}
              >
                {m.meaning}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
