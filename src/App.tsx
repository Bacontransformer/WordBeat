import { useState } from 'react'
import { GameScreen } from './components/GameScreen'
import { LevelSelect } from './components/LevelSelect'
import './App.css'

function App() {
  const [levelId, setLevelId] = useState<string | null>(null)

  if (!levelId) {
    return <LevelSelect onSelect={setLevelId} />
  }

  return (
    <GameScreen
      levelId={levelId}
      onBack={() => setLevelId(null)}
      onGoLevel={setLevelId}
    />
  )
}

export default App
