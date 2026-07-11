import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'

export const wordsRouter = Router()

wordsRouter.get('/packs', async (_req, res) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT slug, name, source,
            (SELECT COUNT(*) FROM words w WHERE w.pack_id = p.id) AS word_count
     FROM word_packs p
     ORDER BY id ASC`,
  )
  res.json(rows)
})

wordsRouter.get('/packs/:slug', async (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit || 80)))
  const [packRows] = await pool.query<RowDataPacket[]>(
    'SELECT id, slug, name FROM word_packs WHERE slug = ? LIMIT 1',
    [req.params.slug],
  )
  const pack = packRows[0]
  if (!pack) {
    res.status(404).json({ error: 'Pack not found' })
    return
  }

  const [words] = await pool.query<RowDataPacket[]>(
    `SELECT id, word, meaning
     FROM words
     WHERE pack_id = ?
     ORDER BY RAND()
     LIMIT ${limit}`,
    [pack.id],
  )

  res.json({
    slug: pack.slug,
    name: pack.name,
    words: words.map((w) => ({
      id: String(w.id),
      word: w.word,
      meaning: w.meaning,
    })),
  })
})
