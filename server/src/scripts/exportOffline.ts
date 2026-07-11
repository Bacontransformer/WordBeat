import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchVocab } from './fetchVocab.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../..')
const rawDir = path.join(rootDir, 'server/data/raw')
const outDir = path.join(rootDir, 'src/data/offline')

type VocabItem = {
  word: string
  translations?: { translation: string; type?: string }[]
}

type Point = { x: number; y: number }

function cleanMeaning(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^[a-z]+\.\s*/i, '')
    .trim()
    .slice(0, 120)
}

function parseVocabFile(filePath: string, limit: number): { word: string; meaning: string }[] {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as VocabItem[]
  const out: { word: string; meaning: string }[] = []
  const seen = new Set<string>()

  for (const item of raw) {
    const word = (item.word || '').trim().toLowerCase()
    if (!word || !/^[a-z][a-z\-']*$/i.test(word)) continue
    const meaning = cleanMeaning(item.translations?.[0]?.translation || '')
    if (!meaning) continue
    if (seen.has(word)) continue
    seen.add(word)
    out.push({ word, meaning })
    if (out.length >= limit) break
  }
  return out
}

function pathFromSteps(start: Point, steps: Array<'R' | 'L' | 'U' | 'D'>): Point[] {
  const result: Point[] = [{ ...start }]
  let x = start.x
  let y = start.y
  for (const step of steps) {
    if (step === 'R') x += 1
    if (step === 'L') x -= 1
    if (step === 'U') y -= 1
    if (step === 'D') y += 1
    result.push({ x, y })
  }
  return result
}

const packsMeta = [
  {
    slug: 'junior',
    name: '初中基础',
    source: 'KyleBing/english-vocabulary · 1-初中',
    file: 'junior.json',
    limit: 600,
  },
  {
    slug: 'cet4',
    name: '大学四级',
    source: 'KyleBing/english-vocabulary · 3-CET4',
    file: 'cet4.json',
    limit: 800,
  },
  {
    slug: 'senior',
    name: '高中进阶',
    source: 'KyleBing/english-vocabulary · 2-高中',
    file: 'senior.json',
    limit: 800,
  },
] as const

const levels = [
  {
    slug: '1',
    name: '错题本边缘',
    subtitle: '初中词 · 入门弯道，学会放塔',
    cols: 10,
    rows: 6,
    startGold: 62,
    lives: 100,
    pack: 'junior',
    modules: ['cannon', 'slow'],
    path: pathFromSteps({ x: 0, y: 1 }, 'RRDDRRRUURRDRR'.split('') as Array<'R' | 'L' | 'U' | 'D'>),
    waves: [
      { delay: 1.4, spawns: [{ kind: 'slime', count: 9, interval: 0.8 }] },
      {
        delay: 2.2,
        spawns: [
          { kind: 'slime', count: 11, interval: 0.62 },
          { kind: 'beetle', count: 3, interval: 1.2 },
        ],
      },
      {
        delay: 2.7,
        spawns: [
          { kind: 'slime', count: 9, interval: 0.52 },
          { kind: 'beetle', count: 4, interval: 1.0 },
        ],
      },
    ],
  },
  {
    slug: '2',
    name: '铅笔盒迷宫',
    subtitle: '初中词 · 回字形小路，练控场',
    cols: 11,
    rows: 7,
    startGold: 68,
    lives: 110,
    pack: 'junior',
    modules: ['cannon', 'slow'],
    path: pathFromSteps({ x: 0, y: 3 }, 'RRRUURRRDDDDRRRUUUR'.split('') as Array<'R' | 'L' | 'U' | 'D'>),
    waves: [
      { delay: 1.2, spawns: [{ kind: 'slime', count: 11, interval: 0.65 }] },
      {
        delay: 2.0,
        spawns: [
          { kind: 'slime', count: 9, interval: 0.52 },
          { kind: 'beetle', count: 5, interval: 0.95 },
        ],
      },
      {
        delay: 2.5,
        spawns: [
          { kind: 'beetle', count: 6, interval: 0.8 },
          { kind: 'slime', count: 12, interval: 0.48 },
          { kind: 'ghost', count: 2, interval: 1.1 },
        ],
      },
    ],
  },
  {
    slug: '3',
    name: '教室走廊',
    subtitle: '四级词 · 喷雾登场，清杂为主',
    cols: 12,
    rows: 6,
    startGold: 78,
    lives: 120,
    pack: 'cet4',
    modules: ['cannon', 'slow', 'spray'],
    path: pathFromSteps({ x: 0, y: 0 }, 'RRRDDLDDRRRRUURRDRRR'.split('') as Array<'R' | 'L' | 'U' | 'D'>),
    waves: [
      {
        delay: 1.2,
        spawns: [
          { kind: 'slime', count: 11, interval: 0.6 },
          { kind: 'ghost', count: 2, interval: 1.15 },
        ],
      },
      {
        delay: 2.1,
        spawns: [
          { kind: 'beetle', count: 5, interval: 0.9 },
          { kind: 'ghost', count: 4, interval: 0.95 },
          { kind: 'slime', count: 9, interval: 0.5 },
        ],
      },
      {
        delay: 2.5,
        spawns: [
          { kind: 'beetle', count: 6, interval: 0.75 },
          { kind: 'ghost', count: 5, interval: 0.8 },
        ],
      },
      {
        delay: 2.9,
        spawns: [
          { kind: 'slime', count: 14, interval: 0.42 },
          { kind: 'ghost', count: 6, interval: 0.7 },
          { kind: 'beetle', count: 5, interval: 0.85 },
        ],
      },
    ],
  },
  {
    slug: '4',
    name: '听力室回廊',
    subtitle: '四级词 · 鬼影穿廊，节奏加快',
    cols: 12,
    rows: 7,
    startGold: 85,
    lives: 130,
    pack: 'cet4',
    modules: ['cannon', 'slow', 'spray'],
    path: pathFromSteps({ x: 0, y: 1 }, 'RRRDDDRRRUUURRRDDDRR'.split('') as Array<'R' | 'L' | 'U' | 'D'>),
    waves: [
      {
        delay: 1.0,
        spawns: [
          { kind: 'ghost', count: 6, interval: 0.75 },
          { kind: 'slime', count: 9, interval: 0.55 },
        ],
      },
      {
        delay: 1.9,
        spawns: [
          { kind: 'beetle', count: 7, interval: 0.78 },
          { kind: 'ghost', count: 6, interval: 0.65 },
          { kind: 'slime', count: 9, interval: 0.48 },
        ],
      },
      {
        delay: 2.4,
        spawns: [
          { kind: 'slime', count: 14, interval: 0.38 },
          { kind: 'ghost', count: 10, interval: 0.55 },
          { kind: 'beetle', count: 6, interval: 0.72 },
        ],
      },
    ],
  },
  {
    slug: '5',
    name: '登机口骚乱',
    subtitle: '高中词 · 长弯道高压波次',
    cols: 13,
    rows: 7,
    startGold: 95,
    lives: 140,
    pack: 'senior',
    modules: ['cannon', 'slow', 'spray'],
    path: pathFromSteps({ x: 0, y: 2 }, 'RRUURRDDDDRRUURRDRRUURR'.split('') as Array<'R' | 'L' | 'U' | 'D'>),
    waves: [
      {
        delay: 1.0,
        spawns: [
          { kind: 'slime', count: 13, interval: 0.48 },
          { kind: 'ghost', count: 5, interval: 0.85 },
        ],
      },
      {
        delay: 1.85,
        spawns: [
          { kind: 'beetle', count: 8, interval: 0.75 },
          { kind: 'ghost', count: 8, interval: 0.65 },
          { kind: 'slime', count: 11, interval: 0.42 },
        ],
      },
      {
        delay: 2.4,
        spawns: [
          { kind: 'slime', count: 16, interval: 0.35 },
          { kind: 'beetle', count: 8, interval: 0.62 },
          { kind: 'ghost', count: 10, interval: 0.55 },
        ],
      },
    ],
  },
  {
    slug: '6',
    name: '红笔风暴',
    subtitle: '高中词 · 终局混编，别漏怪',
    cols: 14,
    rows: 7,
    startGold: 105,
    lives: 150,
    pack: 'senior',
    modules: ['cannon', 'slow', 'spray'],
    path: pathFromSteps({ x: 0, y: 0 }, 'RRRDDDLLDDRRRRRRUUUURRRRDDDRR'.split('') as Array<'R' | 'L' | 'U' | 'D'>),
    waves: [
      {
        delay: 0.8,
        spawns: [
          { kind: 'slime', count: 16, interval: 0.38 },
          { kind: 'ghost', count: 8, interval: 0.6 },
        ],
      },
      {
        delay: 1.7,
        spawns: [
          { kind: 'beetle', count: 10, interval: 0.62 },
          { kind: 'ghost', count: 10, interval: 0.52 },
          { kind: 'slime', count: 12, interval: 0.34 },
        ],
      },
      {
        delay: 2.15,
        spawns: [
          { kind: 'beetle', count: 12, interval: 0.54 },
          { kind: 'ghost', count: 13, interval: 0.44 },
          { kind: 'slime', count: 17, interval: 0.3 },
        ],
      },
    ],
  },
]

async function main() {
  await fetchVocab(false)
  fs.mkdirSync(outDir, { recursive: true })

  const packs: Record<string, { slug: string; name: string; source: string; words: { word: string; meaning: string }[] }> =
    {}

  for (const pack of packsMeta) {
    const filePath = path.join(rawDir, pack.file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing vocab file: ${filePath}. Run npm run db:fetch first.`)
    }
    const words = parseVocabFile(filePath, pack.limit)
    packs[pack.slug] = {
      slug: pack.slug,
      name: pack.name,
      source: pack.source,
      words,
    }
    console.log(`Pack ${pack.slug}: ${words.length} words`)
  }

  const levelsOut = levels.map((level) => ({
    id: level.slug,
    name: level.name,
    subtitle: level.subtitle,
    cols: level.cols,
    rows: level.rows,
    startGold: level.startGold,
    lives: level.lives,
    pack: level.pack,
    pack_slug: level.pack,
    pack_name: packs[level.pack]?.name ?? level.pack,
    unlockedModules: level.modules,
    path: level.path,
    waves: level.waves,
  }))

  fs.writeFileSync(path.join(outDir, 'packs.json'), JSON.stringify(packs, null, 2), 'utf8')
  fs.writeFileSync(path.join(outDir, 'levels.json'), JSON.stringify(levelsOut, null, 2), 'utf8')
  console.log(`Wrote offline data to ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
