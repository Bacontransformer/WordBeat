import type { LevelDef, Point, WordPair } from './types'

const daily: WordPair[] = [
  { id: 'd1', word: 'apple', meaning: '苹果' },
  { id: 'd2', word: 'bread', meaning: '面包' },
  { id: 'd3', word: 'water', meaning: '水' },
  { id: 'd4', word: 'house', meaning: '房子' },
  { id: 'd5', word: 'school', meaning: '学校' },
  { id: 'd6', word: 'friend', meaning: '朋友' },
  { id: 'd7', word: 'happy', meaning: '开心的' },
  { id: 'd8', word: 'quick', meaning: '快速的' },
]

const school: WordPair[] = [
  { id: 's1', word: 'homework', meaning: '家庭作业' },
  { id: 's2', word: 'teacher', meaning: '老师' },
  { id: 's3', word: 'library', meaning: '图书馆' },
  { id: 's4', word: 'pencil', meaning: '铅笔' },
  { id: 's5', word: 'exam', meaning: '考试' },
  { id: 's6', word: 'classroom', meaning: '教室' },
  { id: 's7', word: 'student', meaning: '学生' },
  { id: 's8', word: 'notebook', meaning: '笔记本' },
  { id: 's9', word: 'recess', meaning: '课间休息' },
  { id: 's10', word: 'grade', meaning: '成绩 / 年级' },
]

const travel: WordPair[] = [
  { id: 't1', word: 'ticket', meaning: '票' },
  { id: 't2', word: 'airport', meaning: '机场' },
  { id: 't3', word: 'passport', meaning: '护照' },
  { id: 't4', word: 'luggage', meaning: '行李' },
  { id: 't5', word: 'hotel', meaning: '酒店' },
  { id: 't6', word: 'map', meaning: '地图' },
  { id: 't7', word: 'train', meaning: '火车' },
  { id: 't8', word: 'journey', meaning: '旅程' },
  { id: 't9', word: 'delay', meaning: '延误' },
  { id: 't10', word: 'destination', meaning: '目的地' },
]

function neighborsOfPath(path: Point[], cols: number, rows: number): Point[] {
  const pathSet = new Set(path.map((p) => `${p.x},${p.y}`))
  const build = new Map<string, Point>()
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]

  for (const cell of path) {
    for (const [dx, dy] of dirs) {
      const x = cell.x + dx
      const y = cell.y + dy
      const key = `${x},${y}`
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue
      if (pathSet.has(key)) continue
      build.set(key, { x, y })
    }
  }
  return [...build.values()]
}

function pathFromSteps(start: Point, steps: Array<'R' | 'L' | 'U' | 'D'>): Point[] {
  const path: Point[] = [{ ...start }]
  let x = start.x
  let y = start.y
  for (const step of steps) {
    if (step === 'R') x += 1
    if (step === 'L') x -= 1
    if (step === 'U') y -= 1
    if (step === 'D') y += 1
    path.push({ x, y })
  }
  return path
}

const level1Path = pathFromSteps({ x: 0, y: 1 }, [
  'R',
  'R',
  'D',
  'D',
  'R',
  'R',
  'R',
  'U',
  'U',
  'R',
  'R',
  'D',
  'R',
  'R',
])

const level2Path = pathFromSteps({ x: 0, y: 0 }, [
  'R',
  'R',
  'R',
  'D',
  'D',
  'L',
  'D',
  'D',
  'R',
  'R',
  'R',
  'R',
  'U',
  'U',
  'R',
  'R',
  'D',
  'R',
  'R',
  'R',
])

const level3Path = pathFromSteps({ x: 0, y: 2 }, [
  'R',
  'R',
  'U',
  'U',
  'R',
  'R',
  'D',
  'D',
  'D',
  'D',
  'R',
  'R',
  'U',
  'U',
  'R',
  'R',
  'D',
  'R',
  'R',
  'U',
  'U',
  'R',
  'R',
])

export const LEVELS: LevelDef[] = [
  {
    id: '1',
    name: '错题本边缘',
    subtitle: '日常词汇 · 学会放第一门炮',
    cols: 10,
    rows: 6,
    path: level1Path,
    buildable: neighborsOfPath(level1Path, 10, 6),
    startGold: 80,
    lives: 5,
    unlockedModules: ['cannon', 'slow'],
    words: daily,
    waves: [
      {
        delay: 2,
        spawns: [{ kind: 'slime', count: 6, interval: 1.1 }],
      },
      {
        delay: 3,
        spawns: [{ kind: 'slime', count: 8, interval: 0.9 }],
      },
      {
        delay: 3.5,
        spawns: [
          { kind: 'slime', count: 6, interval: 0.8 },
          { kind: 'beetle', count: 2, interval: 1.6 },
        ],
      },
    ],
  },
  {
    id: '2',
    name: '教室走廊',
    subtitle: '校园词汇 · 喷雾清杂登场',
    cols: 12,
    rows: 6,
    path: level2Path,
    buildable: neighborsOfPath(level2Path, 12, 6),
    startGold: 100,
    lives: 5,
    unlockedModules: ['cannon', 'slow', 'spray'],
    words: school,
    waves: [
      {
        delay: 2,
        spawns: [{ kind: 'slime', count: 8, interval: 0.95 }],
      },
      {
        delay: 3,
        spawns: [
          { kind: 'slime', count: 6, interval: 0.85 },
          { kind: 'beetle', count: 3, interval: 1.4 },
        ],
      },
      {
        delay: 3.5,
        spawns: [
          { kind: 'beetle', count: 4, interval: 1.2 },
          { kind: 'ghost', count: 3, interval: 1.5 },
        ],
      },
      {
        delay: 4,
        spawns: [
          { kind: 'slime', count: 8, interval: 0.7 },
          { kind: 'ghost', count: 4, interval: 1.1 },
          { kind: 'beetle', count: 3, interval: 1.3 },
        ],
      },
    ],
  },
  {
    id: '3',
    name: '登机口骚乱',
    subtitle: '旅行词汇 · 弯道多、节奏快',
    cols: 13,
    rows: 7,
    path: level3Path,
    buildable: neighborsOfPath(level3Path, 13, 7),
    startGold: 120,
    lives: 4,
    unlockedModules: ['cannon', 'slow', 'spray'],
    words: travel,
    waves: [
      {
        delay: 1.5,
        spawns: [
          { kind: 'slime', count: 10, interval: 0.75 },
          { kind: 'ghost', count: 2, interval: 1.8 },
        ],
      },
      {
        delay: 3,
        spawns: [
          { kind: 'beetle', count: 5, interval: 1.1 },
          { kind: 'ghost', count: 4, interval: 1.0 },
        ],
      },
      {
        delay: 3.5,
        spawns: [
          { kind: 'slime', count: 10, interval: 0.55 },
          { kind: 'beetle', count: 5, interval: 0.9 },
          { kind: 'ghost', count: 5, interval: 0.85 },
        ],
      },
    ],
  },
]

export function getLevel(id: string): LevelDef {
  const level = LEVELS.find((l) => l.id === id)
  if (!level) throw new Error(`Level not found: ${id}`)
  return level
}
