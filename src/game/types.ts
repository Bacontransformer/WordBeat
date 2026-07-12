export type Point = { x: number; y: number }

export type MonsterKind = 'slime' | 'beetle' | 'ghost'

/**
 * 攻击方式（机制），与章节外观解耦。
 * 每章各有 6 种同机制、不同造型的模组。
 */
export type ModuleAttack = 'single' | 'splash' | 'slow' | 'beam' | 'chain' | 'blast'

/** 章节专属模组 ID（不再是全局共用的「笔」） */
export type ModuleKind =
  // 丛林
  | 'thorn'
  | 'mushroom'
  | 'vine'
  | 'firefly'
  | 'hornet'
  | 'boulder'
  // 海洋
  | 'harpoon'
  | 'bubble'
  | 'net'
  | 'lighthouse'
  | 'eel'
  | 'trident'
  // 天空
  | 'gale'
  | 'starfall'
  | 'cloudwrap'
  | 'sunbeam'
  | 'thunder'
  | 'meteor'

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
  leakDamage: number
  color: string
}

export type ModuleDef = {
  kind: ModuleKind
  attack: ModuleAttack
  name: string
  desc: string
  cost: number
  range: number
  damage: number
  cooldown: number
  aoe?: number
  slowFactor?: number
  slowDuration?: number
  beamWidth?: number
  chainJumps?: number
  chainRange?: number
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
  chapter: import('./chapters').ChapterId
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
  /** 当前减速倍率（来自施加减速的模组） */
  slowFactor: number
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

export type ProjectileKind = 'dart' | 'cloud' | 'pulse' | 'beam' | 'arc' | 'blast'

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
  life?: number
  blastDamage?: boolean
  slowFactor?: number
  slowDurationMs?: number
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
  maxLives: number
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
