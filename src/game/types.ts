export type Point = { x: number; y: number }

export type MonsterKind = 'slime' | 'beetle' | 'ghost'

export type ModuleKind = 'cannon' | 'spray' | 'slow'

export type WordPair = {
  id: string
  word: string
  meaning: string
}

export type MonsterDef = {
  kind: MonsterKind
  name: string
  hp: number
  speed: number
  reward: number
  color: string
}

export type ModuleDef = {
  kind: ModuleKind
  name: string
  desc: string
  cost: number
  range: number
  damage: number
  cooldown: number
  aoe?: number
  slowFactor?: number
  slowDuration?: number
  color: string
}

export type Wave = {
  delay: number
  spawns: { kind: MonsterKind; count: number; interval: number }[]
}

export type LevelDef = {
  id: string
  name: string
  subtitle: string
  cols: number
  rows: number
  path: Point[]
  buildable: Point[]
  startGold: number
  lives: number
  waves: Wave[]
  words: WordPair[]
  unlockedModules: ModuleKind[]
}

export type Monster = {
  id: string
  kind: MonsterKind
  hp: number
  maxHp: number
  speed: number
  baseSpeed: number
  progress: number
  slowUntil: number
  reward: number
}

export type PlacedModule = {
  id: string
  kind: ModuleKind
  col: number
  row: number
  cooldownLeft: number
  fireUntil: number
}

export type FloatingText = {
  id: string
  x: number
  y: number
  text: string
  color: string
  bornAt: number
}

export type ProjectileKind = 'card' | 'mist' | 'pulse'

export type Projectile = {
  id: string
  kind: ProjectileKind
  moduleKind: ModuleKind
  x: number
  y: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  speed: number
  damage: number
  aoe?: number
  targetId: string | null
  color: string
  radius?: number
  maxRadius?: number
  pulseApplied?: boolean
}

export type ImpactFx = {
  id: string
  x: number
  y: number
  kind: ProjectileKind
  color: string
  bornAt: number
}

export type GamePhase = 'ready' | 'playing' | 'won' | 'lost'

export type MatchRound = {
  words: WordPair[]
  meanings: { id: string; meaning: string }[]
}

export type GameSnapshot = {
  phase: GamePhase
  gold: number
  lives: number
  waveIndex: number
  waveTotal: number
  combo: number
  monsters: Monster[]
  modules: PlacedModule[]
  projectiles: Projectile[]
  impacts: ImpactFx[]
  floaters: FloatingText[]
  selectedModule: ModuleKind | null
  matchRound: MatchRound
  selectedWordId: string | null
  matchedIds: Set<string>
  matchFeedback: 'ok' | 'bad' | null
  preparingLeft: number
  now: number
  firingModuleIds: Set<string>
}
