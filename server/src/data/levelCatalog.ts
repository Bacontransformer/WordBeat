export type Step = 'R' | 'L' | 'U' | 'D'

export type CatalogLevel = {
  slug: string
  name: string
  subtitle: string
  chapter: 'jungle' | 'ocean' | 'sky'
  cols: number
  rows: number
  startGold: number
  lives: number
  pack: 'junior' | 'cet4' | 'senior'
  modules: Array<'cannon' | 'slow' | 'spray'>
  path: { x: number; y: number }[]
  waves: {
    delay: number
    spawns: { kind: 'slime' | 'beetle' | 'ghost'; count: number; interval: number }[]
  }[]
}

function pathFromSteps(start: { x: number; y: number }, steps: Step[]) {
  const path = [{ ...start }]
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

const PATHS: { cols: number; rows: number; start: { x: number; y: number }; steps: string }[] = [
  { cols: 10, rows: 6, start: { x: 0, y: 1 }, steps: 'RRDDRRRUURRDRR' },
  { cols: 11, rows: 7, start: { x: 0, y: 3 }, steps: 'RRRUURRRDDDDRRRUUUR' },
  { cols: 12, rows: 6, start: { x: 0, y: 0 }, steps: 'RRRDDLDDRRRRUURRDRRR' },
  { cols: 12, rows: 7, start: { x: 0, y: 1 }, steps: 'RRRDDDRRRUUURRRDDDRR' },
  { cols: 13, rows: 7, start: { x: 0, y: 2 }, steps: 'RRUURRDDDDRRUURRDRRUURR' },
  { cols: 14, rows: 7, start: { x: 0, y: 0 }, steps: 'RRRDDDLLDDRRRRRRUUUURRRRDDDRR' },
  { cols: 11, rows: 6, start: { x: 0, y: 2 }, steps: 'RRRUUURRDDDRRRUURR' },
  { cols: 12, rows: 7, start: { x: 0, y: 4 }, steps: 'RRRUURRRDDDRRRUURRDD' },
  { cols: 13, rows: 6, start: { x: 0, y: 0 }, steps: 'RRRDDDRRRUUURRRRDDDRR' },
  { cols: 12, rows: 7, start: { x: 0, y: 3 }, steps: 'RRRUURRDDDDRRRUUURRR' },
]

type ChapterSpec = {
  chapter: CatalogLevel['chapter']
  pack: CatalogLevel['pack']
  names: string[]
  modulesEarly: CatalogLevel['modules']
  modulesLate: CatalogLevel['modules']
}

const CHAPTERS: ChapterSpec[] = [
  {
    chapter: 'jungle',
    pack: 'junior',
    names: ['密林词径', '藤蔓回廊', '苔痕岔路', '古木词坛', '翠影终章'],
    modulesEarly: ['cannon', 'slow'],
    modulesLate: ['cannon', 'slow', 'spray'],
  },
  {
    chapter: 'ocean',
    pack: 'cet4',
    names: ['潮汐词港', '深渊回声', '珊瑚听写', '雾岛航标', '海沟终章'],
    modulesEarly: ['cannon', 'slow'],
    modulesLate: ['cannon', 'slow', 'spray'],
  },
  {
    chapter: 'sky',
    pack: 'senior',
    names: ['云端听写', '风暴课本', '雷羽航线', '星屑回廊', '天穹终章'],
    modulesEarly: ['cannon', 'slow', 'spray'],
    modulesLate: ['cannon', 'slow', 'spray'],
  },
]

function wavesFor(tier: number, chapterIndex: number) {
  const slime = 8 + tier * 2 + chapterIndex
  const beetle = Math.max(0, tier - 1 + chapterIndex)
  const ghost = Math.max(0, tier - 2 + Math.floor(chapterIndex / 1))
  const interval = Math.max(0.35, 0.85 - tier * 0.06 - chapterIndex * 0.04)

  const waves: CatalogLevel['waves'] = [
    { delay: 1.4, spawns: [{ kind: 'slime', count: slime, interval }] },
    {
      delay: 2.1,
      spawns: [
        { kind: 'slime', count: slime + 2, interval: interval * 0.9 },
        ...(beetle > 0
          ? [{ kind: 'beetle' as const, count: beetle + 1, interval: interval + 0.35 }]
          : []),
      ],
    },
    {
      delay: 2.6,
      spawns: [
        { kind: 'slime', count: slime + 1, interval: interval * 0.85 },
        ...(beetle > 0
          ? [{ kind: 'beetle' as const, count: beetle + 2, interval: interval + 0.2 }]
          : []),
        ...(ghost > 0
          ? [{ kind: 'ghost' as const, count: ghost + 1, interval: interval + 0.15 }]
          : []),
      ],
    },
  ]

  if (tier >= 3) {
    waves.push({
      delay: 2.9,
      spawns: [
        { kind: 'slime', count: slime + 4, interval: interval * 0.75 },
        { kind: 'beetle', count: beetle + 3, interval: interval + 0.1 },
        { kind: 'ghost', count: Math.max(2, ghost + 2), interval: interval },
      ],
    })
  }

  return waves
}

/** 三章各 5 关，共 15 关。 */
export function buildLevelCatalog(): CatalogLevel[] {
  const out: CatalogLevel[] = []
  let global = 0

  for (let ci = 0; ci < CHAPTERS.length; ci += 1) {
    const spec = CHAPTERS[ci]
    for (let li = 0; li < 5; li += 1) {
      const pathSpec = PATHS[(ci * 5 + li) % PATHS.length]
      const tier = li + 1
      out.push({
        slug: String(global + 1),
        name: spec.names[li],
        subtitle: `${spec.chapter === 'jungle' ? '丛林' : spec.chapter === 'ocean' ? '海洋' : '天空'}章 · 第 ${li + 1}/5 关`,
        chapter: spec.chapter,
        cols: pathSpec.cols,
        rows: pathSpec.rows,
        startGold: 55 + ci * 12 + li * 8,
        lives: 95 + ci * 15 + li * 8,
        pack: spec.pack,
        modules: li < 2 ? spec.modulesEarly : spec.modulesLate,
        path: pathFromSteps(pathSpec.start, pathSpec.steps.split('') as Step[]),
        waves: wavesFor(tier, ci),
      })
      global += 1
    }
  }

  return out
}
