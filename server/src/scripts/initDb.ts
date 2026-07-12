import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import { buildLevelCatalog } from '../data/levelCatalog.js'
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

  // Migrate older DBs that predate chapter / progress tables.
  try {
    await conn.query(
      `ALTER TABLE levels ADD COLUMN chapter VARCHAR(32) NOT NULL DEFAULT 'jungle' AFTER subtitle`,
    )
  } catch {
    /* column already exists */
  }
  await conn.query(`
    CREATE TABLE IF NOT EXISTS player_progress (
      player_id VARCHAR(64) PRIMARY KEY,
      cleared_json JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `)

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

  const levels = buildLevelCatalog()

  for (const [index, level] of levels.entries()) {
    const [levelResult] = await conn.query<mysql.ResultSetHeader>(
      `INSERT INTO levels
        (slug, name, subtitle, chapter, map_cols, map_rows, start_gold, lives, pack_id, path_json, unlocked_modules_json, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?)`,
      [
        level.slug,
        level.name,
        level.subtitle,
        level.chapter,
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
