import { Router } from 'express'
import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from '../db.js'

export const progressRouter = Router()

progressRouter.get('/:playerId', async (req, res) => {
  const playerId = String(req.params.playerId || '').slice(0, 64)
  if (!playerId) {
    res.status(400).json({ error: 'playerId required' })
    return
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT cleared_json FROM player_progress WHERE player_id = ? LIMIT 1',
    [playerId],
  )
  const row = rows[0]
  if (!row) {
    res.json({ playerId, clearedIds: [] })
    return
  }
  const cleared =
    typeof row.cleared_json === 'string' ? JSON.parse(row.cleared_json) : row.cleared_json
  res.json({
    playerId,
    clearedIds: Array.isArray(cleared) ? cleared.map(String) : [],
  })
})

progressRouter.put('/:playerId', async (req, res) => {
  const playerId = String(req.params.playerId || '').slice(0, 64)
  const clearedIds = Array.isArray(req.body?.clearedIds)
    ? req.body.clearedIds.map(String).slice(0, 64)
    : []

  if (!playerId) {
    res.status(400).json({ error: 'playerId required' })
    return
  }

  await pool.query<ResultSetHeader>(
    `INSERT INTO player_progress (player_id, cleared_json)
     VALUES (?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE
       cleared_json = VALUES(cleared_json),
       updated_at = CURRENT_TIMESTAMP`,
    [playerId, JSON.stringify(clearedIds)],
  )

  res.json({ playerId, clearedIds })
})
