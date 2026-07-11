import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { fetchVocab } from './fetchVocab.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../..')
dotenv.config({ path: path.join(rootDir, '.env') })

type VocabItem = {
  word: string
  translations?: { translation: string; type?: string }[]
}

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

function pathFromSteps(
  start: { x: number; y: number },
  steps: Array<'R' | 'L' | 'U' | 'D'>,
) {
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

async function main() {
  const host = process.env.MYSQL_HOST || 'localhost'
  const port = Number(process.env.MYSQL_PORT || 3306)
  const user = process.env.MYSQL_USER || 'root'
  const password = process.env.MYSQL_PASSWORD || ''
  const database = process.env.MYSQL_DATABASE || 'wordbeat'

  console.log(`Connecting ${user}@${host}:${port} ...`)
  await fetchVocab(false)

  const conn = await mysql.createConnection({ host, port, user, password, multipleStatements: true })

  const schema = fs.readFileSync(path.join(rootDir, 'server/sql/schema.sql'), 'utf8')
  await conn.query(schema)
  await conn.changeUser({ database })

  const rawDir = path.join(rootDir, 'server/data/raw')
  const packs = [
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

  await conn.query('DELETE FROM level_waves')
  await conn.query('DELETE FROM levels')
  await conn.query('DELETE FROM words')
  await conn.query('DELETE FROM word_packs')

  const packIds: Record<string, number> = {}

  for (const pack of packs) {
    const filePath = path.join(rawDir, pack.file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing vocab file: ${filePath}. Run download first.`)
    }
    const words = parseVocabFile(filePath, pack.limit)
    const [packResult] = await conn.query<{ insertId: number } & mysql.ResultSetHeader>(
      'INSERT INTO word_packs (slug, name, source) VALUES (?, ?, ?)',
      [pack.slug, pack.name, pack.source],
    )
    const packId = Number(packResult.insertId)
    packIds[pack.slug] = packId

    const chunkSize = 200
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize)
      const values = chunk.map((w) => [packId, w.word, w.meaning])
      await conn.query('INSERT INTO words (pack_id, word, meaning) VALUES ?', [values])
    }
    console.log(`Imported pack ${pack.slug}: ${words.length} words`)
  }

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
      path: pathFromSteps(
        { x: 0, y: 3 },
        'RRRUURRRDDDDRRRUUUR'.split('') as Array<'R' | 'L' | 'U' | 'D'>,
      ),
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
      path: pathFromSteps(
        { x: 0, y: 0 },
        'RRRDDLDDRRRRUURRDRRR'.split('') as Array<'R' | 'L' | 'U' | 'D'>,
      ),
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
      path: pathFromSteps(
        { x: 0, y: 1 },
        'RRRDDDRRRUUURRRDDDRR'.split('') as Array<'R' | 'L' | 'U' | 'D'>,
      ),
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
      path: pathFromSteps(
        { x: 0, y: 2 },
        'RRUURRDDDDRRUURRDRRUURR'.split('') as Array<'R' | 'L' | 'U' | 'D'>,
      ),
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
      path: pathFromSteps(
        { x: 0, y: 0 },
        'RRRDDDLLDDRRRRRRUUUURRRRDDDRR'.split('') as Array<'R' | 'L' | 'U' | 'D'>,
      ),
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

  for (const [index, level] of levels.entries()) {
    const [levelResult] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO levels
        (slug, name, subtitle, map_cols, map_rows, start_gold, lives, pack_id, path_json, unlocked_modules_json, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?)`,
      [
        level.slug,
        level.name,
        level.subtitle,
        level.cols,
        level.rows,
        level.startGold,
        level.lives,
        packIds[level.pack],
        JSON.stringify(level.path),
        JSON.stringify(level.modules),
        index + 1,
      ],
    )
    const levelId = Number(levelResult.insertId)
    for (const [wi, wave] of level.waves.entries()) {
      await conn.query(
        `INSERT INTO level_waves (level_id, wave_index, delay_sec, spawns_json)
         VALUES (?, ?, ?, CAST(? AS JSON))`,
        [levelId, wi, wave.delay, JSON.stringify(wave.spawns)],
      )
    }
    console.log(`Seeded level ${level.slug}: ${level.name}`)
  }

  await conn.end()
  console.log('Database init complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
