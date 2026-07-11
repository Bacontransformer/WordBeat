import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'

type Point = { x: number; y: number }

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

export const levelsRouter = Router()

levelsRouter.get('/', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT l.slug AS id, l.name, l.subtitle, l.sort_order,
            p.slug AS pack_slug, p.name AS pack_name
     FROM levels l
     JOIN word_packs p ON p.id = l.pack_id
     ORDER BY l.sort_order ASC`,
  )
  res.json(rows)
})

levelsRouter.get('/:id', async (req, res) => {
  const [levelRows] = await pool.query<RowDataPacket[]>(
    `SELECT l.*, p.slug AS pack_slug
     FROM levels l
     JOIN word_packs p ON p.id = l.pack_id
     WHERE l.slug = ?
     LIMIT 1`,
    [req.params.id],
  )
  const level = levelRows[0]
  if (!level) {
    res.status(404).json({ error: 'Level not found' })
    return
  }

  const [waveRows] = await pool.query<RowDataPacket[]>(
    `SELECT delay_sec, spawns_json
     FROM level_waves
     WHERE level_id = ?
     ORDER BY wave_index ASC`,
    [level.id],
  )

  const wordLimit = Math.min(200, Math.max(8, Number(req.query.words || 60)))
  const [wordRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, word, meaning
     FROM words
     WHERE pack_id = ?
     ORDER BY RAND()
     LIMIT ${wordLimit}`,
    [level.pack_id],
  )

  const path = typeof level.path_json === 'string' ? JSON.parse(level.path_json) : level.path_json
  const unlockedModules =
    typeof level.unlocked_modules_json === 'string'
      ? JSON.parse(level.unlocked_modules_json)
      : level.unlocked_modules_json

  res.json({
    id: level.slug,
    name: level.name,
    subtitle: level.subtitle,
    cols: level.cols,
    rows: level.rows,
    startGold: level.start_gold,
    lives: level.lives,
    packSlug: level.pack_slug,
    path,
    buildable: neighborsOfPath(path, level.cols, level.rows),
    unlockedModules,
    waves: waveRows.map((w) => ({
      delay: Number(w.delay_sec),
      spawns: typeof w.spawns_json === 'string' ? JSON.parse(w.spawns_json) : w.spawns_json,
    })),
    words: wordRows.map((w) => ({
      id: String(w.id),
      word: w.word,
      meaning: w.meaning,
    })),
  })
})
