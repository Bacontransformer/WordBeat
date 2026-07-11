import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rawDir = path.resolve(__dirname, '../../data/raw')

const FILES = [
  {
    name: 'junior.json',
    url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/1-%E5%88%9D%E4%B8%AD-%E9%A1%BA%E5%BA%8F.json',
  },
  {
    name: 'cet4.json',
    url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/3-CET4-%E9%A1%BA%E5%BA%8F.json',
  },
  {
    name: 'senior.json',
    url: 'https://raw.githubusercontent.com/KyleBing/english-vocabulary/master/json/2-%E9%AB%98%E4%B8%AD-%E9%A1%BA%E5%BA%8F.json',
  },
] as const

export async function fetchVocab(force = false): Promise<void> {
  fs.mkdirSync(rawDir, { recursive: true })

  for (const file of FILES) {
    const dest = path.join(rawDir, file.name)
    if (!force && fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`Skip existing ${file.name}`)
      continue
    }

    console.log(`Downloading ${file.name} ...`)
    const res = await fetch(file.url)
    if (!res.ok) {
      throw new Error(`Failed to download ${file.name}: ${res.status} ${res.statusText}`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(dest, buf)
    console.log(`Saved ${file.name} (${buf.length} bytes)`)
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  fetchVocab(process.argv.includes('--force')).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
