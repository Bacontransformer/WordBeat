import fs from 'node:fs'

const path = 'src/game/useGame.ts'
let text = fs.readFileSync(path)

// Replace broken sequence for 漏怪! (e6 bc 8f e6 80 3f -> e6 bc 8f e6 80 aa 21)
const broken = Buffer.from([0xe6, 0xbc, 0x8f, 0xe6, 0x80, 0x3f])
const fixed = Buffer.from([0xe6, 0xbc, 0x8f, 0xe6, 0x80, 0xaa, 0x21])

const idx = text.indexOf(broken)
if (idx === -1) {
  console.log('broken sequence not found, scanning...')
} else {
  text = Buffer.concat([text.subarray(0, idx), fixed, text.subarray(idx + broken.length)])
  fs.writeFileSync(path, text)
  console.log('fixed at', idx)
}

// Also fix any 金 garbled sequences if present - search for text with +
const asStr = fs.readFileSync(path, 'utf8')
const replaced = asStr
  .replace(/text: '[^']*怪[^']*'/, "text: '漏怪!'")
  .replace(/text: `\+\$\{gain\}[^`]*`/, 'text: `+${gain} 金`')
fs.writeFileSync(path, replaced, 'utf8')
console.log('rewrote utf8')

// validate
const b = fs.readFileSync(path)
let i = 0
let bad = 0
while (i < b.length) {
  const c = b[i]
  if (c <= 0x7f) {
    i++
    continue
  }
  if (c >= 0xc2 && c <= 0xdf && i + 1 < b.length && (b[i + 1] & 0xc0) === 0x80) {
    i += 2
    continue
  }
  if (
    c >= 0xe0 &&
    c <= 0xef &&
    i + 2 < b.length &&
    (b[i + 1] & 0xc0) === 0x80 &&
    (b[i + 2] & 0xc0) === 0x80
  ) {
    i += 3
    continue
  }
  bad++
  console.log('still bad at', i, b.subarray(i, i + 6))
  i++
}
console.log('bad count', bad)
