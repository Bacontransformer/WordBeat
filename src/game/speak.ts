import { Capacitor } from '@capacitor/core'

export type VoiceAccent = 'en-US' | 'en-GB'

const ACCENT_KEY = 'wordbeat.voiceAccent'

let voicesReady = false
let cachedNativeLangs: string[] | null = null

function ensureWebVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  const load = () => {
    voicesReady = window.speechSynthesis.getVoices().length > 0
  }
  load()
  if (!voicesReady) {
    window.speechSynthesis.addEventListener('voiceschanged', load, { once: true })
  }
}

ensureWebVoices()

export function getVoiceAccent(): VoiceAccent {
  try {
    const raw = localStorage.getItem(ACCENT_KEY)
    if (raw === 'en-GB' || raw === 'en-US') return raw
  } catch {
    /* ignore */
  }
  return 'en-US'
}

export function setVoiceAccent(accent: VoiceAccent) {
  try {
    localStorage.setItem(ACCENT_KEY, accent)
  } catch {
    /* ignore */
  }
}

function normalizeLangTag(tag: string) {
  return tag.replace(/_/g, '-').toLowerCase()
}

/** Prefer requested accent; fall back so speech never silently fails. */
function resolveLangTag(preferred: VoiceAccent, available: string[]): string {
  const list = available.map(normalizeLangTag)
  const candidates =
    preferred === 'en-GB'
      ? ['en-gb', 'en-uk', 'en', 'en-us']
      : ['en-us', 'en', 'en-gb']

  for (const c of candidates) {
    const hit = list.find((l) => l === c || l.startsWith(`${c}-`))
    if (hit) {
      const original = available.find((a) => normalizeLangTag(a) === hit)
      return original ?? preferred
    }
  }

  if (list.length === 0) {
    // Device list unknown — still try preferred, then US
    return preferred === 'en-GB' ? 'en-GB' : 'en-US'
  }

  const anyEn = available.find((a) => normalizeLangTag(a).startsWith('en'))
  return anyEn ?? available[0] ?? 'en-US'
}

function pickWebVoice(lang: string) {
  const voices = window.speechSynthesis.getVoices()
  const tag = normalizeLangTag(lang)
  const isGb = tag.startsWith('en-gb') || tag.startsWith('en-uk')

  const preferName = isGb
    ? /British|UK|en-GB|Daniel|Serena|Kate|Google UK/i
    : /en-US|US English|Samantha|Google US|Microsoft (Aria|Jenny|Guy)/i

  return (
    voices.find((v) => preferName.test(`${v.lang} ${v.name}`)) ??
    voices.find((v) => normalizeLangTag(v.lang) === tag) ??
    voices.find((v) => normalizeLangTag(v.lang).startsWith(tag.slice(0, 2))) ??
    voices.find((v) => normalizeLangTag(v.lang).startsWith('en')) ??
    voices[0]
  )
}

function speakWithWeb(text: string, lang: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false

  ensureWebVoices()
  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = 0.92
  utter.pitch = 1

  const voice = pickWebVoice(lang)
  if (voice) {
    utter.voice = voice
    utter.lang = voice.lang || lang
  }

  window.speechSynthesis.speak(utter)
  return true
}

async function getNativeLanguages(
  TextToSpeech: typeof import('@capacitor-community/text-to-speech').TextToSpeech,
): Promise<string[]> {
  if (cachedNativeLangs && cachedNativeLangs.length) return cachedNativeLangs
  try {
    const res = await TextToSpeech.getSupportedLanguages()
    cachedNativeLangs = res.languages ?? []
  } catch {
    cachedNativeLangs = []
  }
  return cachedNativeLangs
}

async function pickNativeVoiceIndex(
  TextToSpeech: typeof import('@capacitor-community/text-to-speech').TextToSpeech,
  preferred: VoiceAccent,
): Promise<number | undefined> {
  try {
    const { voices } = await TextToSpeech.getSupportedVoices()
    if (!voices?.length) return undefined
    const wantGb = preferred === 'en-GB'
    const scored = voices.map((v, index) => {
      const blob = `${v.lang ?? ''} ${v.name ?? ''}`.toLowerCase()
      let score = 0
      if (wantGb) {
        if (/en-gb|en_gb|british|uk english|england/.test(blob)) score += 3
        if (/gb|uk/.test(blob)) score += 1
      } else {
        if (/en-us|en_us|us english|american/.test(blob)) score += 3
        if (/us/.test(blob)) score += 1
      }
      if (blob.startsWith('en') || /\ben[-_]/.test(blob)) score += 0.5
      return { index, score }
    })
    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.score > 0 ? scored[0].index : undefined
  } catch {
    return undefined
  }
}

/** Speak an English word: native TTS on Capacitor, Web Speech elsewhere. */
export async function speakWord(word: string, accent = getVoiceAccent()) {
  const text = word.trim()
  if (!text) return

  if (Capacitor.isNativePlatform()) {
    try {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
      const langs = await getNativeLanguages(TextToSpeech)
      const lang = resolveLangTag(accent, langs)
      const voice = await pickNativeVoiceIndex(TextToSpeech, accent)

      await TextToSpeech.stop()
      // 部分机型 stop 后立刻 speak 会被吞掉
      await new Promise((r) => setTimeout(r, 40))

      await TextToSpeech.speak({
        text,
        lang,
        rate: 0.95,
        pitch: 1.0,
        volume: 1.0,
        category: 'playback',
        ...(voice != null ? { voice } : {}),
      })
      return
    } catch (err) {
      console.warn('Native TTS failed, falling back', err)
      // 英音不可用时至少保证有声
      const fallbackLang = accent === 'en-GB' ? 'en-US' : accent
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
        await TextToSpeech.speak({
          text,
          lang: fallbackLang,
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
          category: 'playback',
        })
        return
      } catch {
        /* web fallback below */
      }
    }
  }

  const webLang = resolveLangTag(accent, [])
  if (!speakWithWeb(text, webLang) && accent === 'en-GB') {
    speakWithWeb(text, 'en-US')
  }
}
