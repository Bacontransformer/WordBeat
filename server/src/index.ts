import cors from 'cors'
import express from 'express'
import { pool } from './db.js'
import { levelsRouter } from './routes/levels.js'
import { wordsRouter } from './routes/words.js'

const app = express()
const port = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) })
  }
})

app.use('/api/levels', levelsRouter)
app.use('/api/words', wordsRouter)

app.listen(port, () => {
  console.log(`WordBeat API listening on http://localhost:${port}`)
})
