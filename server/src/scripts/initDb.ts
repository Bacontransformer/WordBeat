import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

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
      subtitle: '初中基础词 · 学会放第一门炮',
      cols: 10,
      rows: 6,
      startGold: 80,
      lives: 5,
      pack: 'junior',
      modules: ['cannon', 'slow'],
      path: pathFromSteps({ x: 0, y: 1 }, [
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
      ]),
      waves: [
        { delay: 2, spawns: [{ kind: 'slime', count: 6, interval: 1.1 }] },
        { delay: 3, spawns: [{ kind: 'slime', count: 8, interval: 0.9 }] },
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
      slug: '2',
      name: '教室走廊',
      subtitle: '四级词汇 · 喷雾清杂登场',
      cols: 12,
      rows: 6,
      startGold: 100,
      lives: 5,
      pack: 'cet4',
      modules: ['cannon', 'slow', 'spray'],
      path: pathFromSteps({ x: 0, y: 0 }, [
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
      ]),
      waves: [
        { delay: 2, spawns: [{ kind: 'slime', count: 8, interval: 0.95 }] },
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
      slug: '3',
      name: '登机口骚乱',
      subtitle: '高中词汇 · 弯道多、节奏快',
      cols: 13,
      rows: 7,
      startGold: 120,
      lives: 4,
      pack: 'senior',
      modules: ['cannon', 'slow', 'spray'],
      path: pathFromSteps({ x: 0, y: 2 }, [
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
      ]),
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
