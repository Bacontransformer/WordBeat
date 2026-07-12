import { Capacitor } from '@capacitor/core'

export type VoiceAccent = 'en-US' | 'en-GB'

const ACCENT_KEY = 'wordbeat.voiceAccent'

let voicesReady = false

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

function pickWebVoice(lang: VoiceAccent) {
  const voices = window.speechSynthesis.getVoices()
  const prefer =
    lang === 'en-GB'
      ? /en-GB|en_GB|British|UK|Daniel|Serena|Kate/i
      : /en-US|en_US|US English|Samantha|Google US|Microsoft (Aria|Jenny|Guy)/i

  return (
    voices.find((v) => prefer.test(`${v.lang} ${v.name}`)) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())) ??
    voices.find((v) => v.lang.startsWith('en'))
  )
}

function speakWithWeb(text: string, lang: VoiceAccent) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  ensureWebVoices()
  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = lang
  utter.rate = 0.92
  utter.pitch = 1

  const voice = pickWebVoice(lang)
  if (voice) utter.voice = voice

  window.speechSynthesis.speak(utter)
}

/** Speak an English word: native TTS on Capacitor, Web Speech elsewhere. */
export async function speakWord(word: string, accent = getVoiceAccent()) {
  const text = word.trim()
  if (!text) return

  if (Capacitor.isNativePlatform()) {
    try {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech')
      await TextToSpeech.stop()
      await TextToSpeech.speak({
        text,
        lang: accent,
        rate: 0.95,
        pitch: 1.0,
        volume: 1.0,
        category: 'playback',
      })
      return
    } catch (err) {
      console.warn('Native TTS failed, falling back to Web Speech', err)
    }
  }

  speakWithWeb(text, accent)
}
