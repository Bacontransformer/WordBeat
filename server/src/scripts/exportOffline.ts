import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLevelCatalog } from '../data/levelCatalog.js'
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

const levels = buildLevelCatalog()

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
    chapter: level.chapter,
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
