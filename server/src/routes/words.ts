import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'

export const wordsRouter = Router()

async function listPacks(_req: unknown, res: { json: (body: unknown) => void }) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT slug, name, source,
            (SELECT COUNT(*) FROM words w WHERE w.pack_id = p.id) AS word_count
     FROM word_packs p
     ORDER BY id ASC`,
  )
  res.json(rows)
}

async function packWords(
  req: { params: { slug: string }; query: { limit?: string } },
  res: { status: (code: number) => { json: (body: unknown) => void }; json: (body: unknown) => void },
) {
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
}

wordsRouter.get('/', listPacks)
wordsRouter.get('/:slug/words', packWords)

// Backward-compatible aliases under /api/words/*
export const wordsLegacyRouter = Router()
wordsLegacyRouter.get('/packs', listPacks)
wordsLegacyRouter.get('/packs/:slug', packWords)
